import admin from 'firebase-admin';

export default {
	async fetch(request, env, ctx) {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
		}

		const url = new URL(request.url);

		try {
			if (!admin.apps.length) {
				const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
				admin.initializeApp({
					credential: admin.credential.cert(serviceAccount)
				});
			}

			// ==========================================
			// API 1: 古い匿名アカウントとデータの削除
			// ==========================================
			if (url.pathname === '/api/cleanup-anonymous') {
				const { token, oldUid } = await request.json();
				if (!token) return new Response('Missing token', { status: 400, headers: corsHeaders });

				const decodedToken = await admin.auth().verifyIdToken(token);
				const targetUid = oldUid || decodedToken.uid;

				if (oldUid) {
					try {
						const targetUser = await admin.auth().getUser(targetUid);
						// Provider data exists if the account is linked to email, Google, etc.
						// Anonymous accounts have empty providerData.
						if (targetUser.providerData && targetUser.providerData.length > 0) {
							return new Response('Target user is not anonymous', { status: 403, headers: corsHeaders });
						}
					} catch(e) {
						// User might already be deleted, which is fine
					}
				}

				const db = admin.firestore();
				await db.collection('users').doc(targetUid).delete().catch(() => { });
				// await db.collection('scores').doc(targetUid).delete().catch(() => {});

				await admin.auth().deleteUser(targetUid).catch(() => {});

				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			return new Response('API Not Found', { status: 404, headers: corsHeaders });

		} catch (error) {
			console.error(error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	}
};