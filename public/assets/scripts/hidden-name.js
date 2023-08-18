const names = [
  ["Clever | Connect every student to a world of learning", "clever.com"],
  ["i-Ready","i-ready.com"],
  ["Campus Student", "infinitecampus.org"],
  ["Google Classroom", "classroom.google.com"]
]
const item = names[Math.floor(Math.random()*names.length)]

document.title = item[0];
var link = document.createElement('link');
link.rel = 'icon';
link.href = item[1]
document.head.appendChild(link);