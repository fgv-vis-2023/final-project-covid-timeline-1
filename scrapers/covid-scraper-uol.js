let urls = []
for(let i = 0; i < 50; i++) {
    let next_link = $('.ver-mais ')[0]['baseURI']
    urls.push(next_link)
    $('.ver-mais')[0].click()
    //stop for 0.5 seconds
    await new Promise(r => setTimeout(r, 300));
}