t=open('template.html').read()
for k,f in [('CSS','style.css'),('ENGINE','engine.js'),('PRESETS','presets.js'),('DATA','data.js'),('APP','app.js')]:
    t=t.replace('/*%s*/'%k, open(f).read().replace('</script>','<\\/script>'))
t=t.replace('/*LESSONS*/', open('play.js').read() + '\n' + open('lessons.js').read().replace('</script>','<\\/script>'))
open('index.html','w').write(t)
print(len(t))
