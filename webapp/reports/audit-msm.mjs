const URL = 'http://www.gencalc.com/gen/dutch_genc.php?sp=1NeofSca'
const msm0 = ['', 'ino', 'ino*pd']
const msm1 = ['', '1ino', '2ino', '1ino*pd', '2ino*pd']

function checkedValue(html, name) {
  const escaped = name.replace(/[[\]]/g, (m) => `\\${m}`)
  const re = new RegExp(`<input[^>]*name="${escaped}"[^>]*>`, 'gi')
  const list = [...html.matchAll(re)].map((m) => m[0])
  for (const tag of list) {
    if (/checked/i.test(tag)) {
      const vm = tag.match(/value="([^"]*)"/i)
      return vm ? vm[1] : ''
    }
  }
  return ''
}

for (const a of msm0) {
  for (const b of msm1) {
    const params = new URLSearchParams({ S: 'Genereer' })
    if (a) params.set('msm[0]', a)
    if (b) params.set('msm[1]', b)

    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const html = await response.text()
    const ra = checkedValue(html, 'msm[0]')
    const rb = checkedValue(html, 'msm[1]')
    console.log(`${a || '-'} + ${b || '-'} => ${ra || '-'} + ${rb || '-'}`)
  }
}
