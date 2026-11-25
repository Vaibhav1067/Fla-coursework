import json,subprocess,re
D=subprocess.check_output(['node','-e',"const D=require('/home/claude/build/data.js');console.log(JSON.stringify({papers:D.papers,units:D.units,topics:D.topics,templates:D.templates,repeats:D.repeats,watch:D.watch,slots:D.slots,facts:D.facts}))"]).decode()
css=open('style.css').read();mcq=open('mcq.js').read()+open('slots.js').read()+open('newpapers.js').read();app=open('app.js').read()
html=f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FLA 21CSC301T · Past paper analysis and study plan</title><style>{css}</style></head>
<body><div id="app"></div><script>
const D={D};
{mcq}
{app}
</script></body></html>'''
open('index.html','w').write(html);print(len(html))
