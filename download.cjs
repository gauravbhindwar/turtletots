const fs = require('fs');
const https = require('https');
const path = require('path');

const screens = [
  { name: '1_home', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRlZjBkNzkyMDliOTRkNWRiYWU1YTEyMzU2MTY3OTAxEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '2_product_details', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzJhNjVkNTBlNTI2NDQ5YmZiMDlhYmYwYTAyMjQ0NTJmEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '3_cart', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQzOWVkOTE1NzBhYzRiYTNhNWFiZDFhYmVmZDM0YjVkEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '4_admin_dash', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Q4OTg4MjYwN2UwNTQyNDY5ODM0N2VhODliZGM5M2VhEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '5_admin_edit_product', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzE2ZWYzYzMwZjkwMDQ2MGI4NTNlNTVlODY2NDZmNmZjEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '6_admin_categories', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2YwNDE2NzU2MjE3ODRjYTViNzNkMWRlNWZhMmEyZDM3EgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '7_admin_products', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzdiMWZjZmEwNjA3ODQyMDNhMzgyMTRkMmNlNTY0NzIwEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '8_landing', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwZDNiYjZjOGE3YzRjNmRhZTdjMDFkOGIxZmIzNjM2EgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' }
];

screens.forEach(screen => {
  https.get(screen.url, (res) => {
    const file = fs.createWriteStream(path.join(__dirname, 'stitch_screens', `${screen.name}.html`));
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${screen.name}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${screen.name}:`, err.message);
  });
});
