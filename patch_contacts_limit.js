const fs = require('fs');

// 1. Patch api/contacts/index.js
let path1 = 'pages/api/contacts/index.js';
let content1 = fs.readFileSync(path1, 'utf8');

const oldFetch1 = `    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }`;

const newFetch1 = `    let data = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: chunk, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .range(from, from + limit - 1);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (chunk && chunk.length > 0) {
        data = data.concat(chunk);
        from += limit;
      }
      
      if (!chunk || chunk.length < limit) {
        hasMore = false;
      }
    }`;

if (content1.includes('const { data, error } = await supabase')) {
  content1 = content1.replace(oldFetch1, newFetch1);
  fs.writeFileSync(path1, content1, 'utf8');
  console.log('Patched api/contacts/index.js');
}

// 2. Patch api/admin/contacts-all.js
let path2 = 'pages/api/admin/contacts-all.js';
let content2 = fs.readFileSync(path2, 'utf8');

const oldFetch2 = `    // Carica i contatti (con filtro account opzionale)
    let query = supabaseAdmin
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter_user_id) {
      query = query.eq('user_id', filter_user_id);
    }

    const { data: contacts, error } = await query;
    if (error) throw error;`;

const newFetch2 = `    // Carica i contatti (con filtro account opzionale e paginazione per superare il limite di 1000)
    let contacts = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (filter_user_id) {
        query = query.eq('user_id', filter_user_id);
      }

      const { data: chunk, error } = await query;
      if (error) throw error;

      if (chunk && chunk.length > 0) {
        contacts = contacts.concat(chunk);
        from += limit;
      }
      
      if (!chunk || chunk.length < limit) {
        hasMore = false;
      }
    }`;

if (content2.includes('let query = supabaseAdmin')) {
  content2 = content2.replace(oldFetch2, newFetch2);
  fs.writeFileSync(path2, content2, 'utf8');
  console.log('Patched api/admin/contacts-all.js');
}

