export async function onRequestPost(context) {
  try {
    const authHeader = context.request.headers.get('Authorization') || '';
    const accessToken = authHeader.replace('Bearer ', '');
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token.' }), { status: 401 });
    }

    const supabaseUrl = context.env.SUPABASE_URL;
    const serviceRoleKey = context.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verify the token and get the user it belongs to
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
      Authorization: `Bearer ${accessToken}`,
        apikey: serviceRoleKey,
      },
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) {
      return new Response(JSON.stringify({ error: 'Invalid session.' }), { status: 401 });
    }

    // Delete the user via the admin API (cascades to profiles/conversations/messages/memory)
    const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userData.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      return new Response(JSON.stringify({ error: 'Deletion failed: ' + errText }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
        }
