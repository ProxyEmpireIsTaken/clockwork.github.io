/* Used across the Clockwork main pages */
document.querySelector(".navbar").innerHTML = `<a href="https://discord.gg/Sb8NzVbqX8">Discord</a> | 
© 2023 <a href="https://redstone-network.vercel.app/">Redstone Network</a>`

if (document.location.pathname.startsWith("/get-started")) {
  const url = "https://"+document.location.hostname+"/os/"
  const aboutBlanker = `javascript:
  var win = window.open("","_blank","popup=yes");
  win.location.origin = 'https://google.com';
  win.document.body.innerHTML = \`<!DOCTYPE html>
  <html>
  <body>
  <iframe src="\${atob('${btoa(url)}')}"></iframe>
  <style>
  * {margin: 0; padding: 0;}iframe {width: 100%;height: 100vh;border: none;}
  </style>
  </body>
  </html>\`;
  document.location.reload();`
  document.querySelector("#blanker").href = aboutBlanker;
}