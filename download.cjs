const https = require('https');
const fs = require('fs');

const downloads = [
  { name: '10_admin_login.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M4OTM2MjY1NWE3ZTRmYTFhNWNlNzQ0MTM1OTNiMTJhEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '11_admin_settings.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIwMjZkMGRlMTkxMTRhMDdiMjNjZWIyZDI3YjQzYjExEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '12_admin_orders.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ1NjRiOTdkOWZmNDQzYzQ4ZDM4ZmM3ZWI3NjhlYjFhEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '13_admin_support.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ2NTRjOTE1ODI2MjRkOTliYTFhZDdkMjI4MGU5ODVlEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '14_admin_ai.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZmMGMxNWE4N2YxZTQyY2I5NTllZDFiODNjZTU4ZjJmEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '15_best_sellers.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2RkODQzOGY0M2E0YzQ4ZWU5NDJhNDE3ODk1YjA1Njk5EgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' },
  { name: '16_new_arrivals.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VhMDI2NzI0YWIxYzQxMGZhYTlmOTBkNGE0OGFhZDkzEgsSBxDOo_X-4QIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDYxOTE0MTIzNDIzMDM5NzIxMg&filename=&opi=89354086' }
];

downloads.forEach(dl => {
  const file = fs.createWriteStream('./stitch_screens/' + dl.name);
  https.get(dl.url, function(response) {
    response.pipe(file);
    file.on('finish', () => file.close());
  });
});
