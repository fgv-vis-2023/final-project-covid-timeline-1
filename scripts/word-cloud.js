var carousel = $('#carousel'),
    threshold = 150,
    slideWidth = 900,
    dragStart, 
    dragEnd;
let currentDate = 'Jan 2020';
// carousel.on('mousedown', function(){
//   if (carousel.hasClass('transition')) return;
//   dragStart = event.pageX;
//   $(this).on('mousemove', function(){
//     dragEnd = event.pageX;
//     $(this).css('transform','translateX('+ dragPos() +'px)')
//   })
//   $(document).on('mouseup', function(){
//     if (dragPos() > threshold) { return shiftSlide(1) }
//     if (dragPos() < -threshold) { return shiftSlide(-1) }
//     shiftSlide(0);
//   })
// });
function updateCurrentDate(date){
  console.log(date);  
  $("#current-date").text(date);
}
function dragPos() {
  return dragEnd - dragStart;
}

function shiftSlide(direction) {
  if (carousel.hasClass('transition')) return;
  dragEnd = dragStart;
  $(document).off('mouseup')
  carousel.off('mousemove')
          .addClass('transition')
          .css('transform','translateX(' + (direction * slideWidth) + 'px)'); 
  setTimeout(function(){
    if (direction === 1) {
      $('.slide:first').before($('.slide:last'));
      currentDate = list_of_dates[list_of_dates.indexOf(currentDate)-1];
      updateCurrentDate(currentDate);
    } else if (direction === -1) {
      $('.slide:last').after($('.slide:first'));
      currentDate = list_of_dates[list_of_dates.indexOf(currentDate)+1];
      updateCurrentDate(currentDate);
    }
    carousel.removeClass('transition')
		carousel.css('transform','translateX(0px)'); 
  },700)
}
function getPaddedMonth(month){
    if(month<10){
        return '0'+month;
    }
    return month;
}
let list_of_dates = [];
// Create a span tag for each figure inside ../assets/figures and add it to the #window div
for(let year=2020; year<=2023; year++){
    for(let month=1; month<=12; month++){
      if(year == 2023 & month > 4) break;
      let spanDate = new Date(year, month-1, 1);
      list_of_dates.push(spanDate.toLocaleString('default', { month: 'short' })+' '+year);
      let img_url = '../assets/figures/'+year+'-'+getPaddedMonth(month)+'-01.png';
      let newSpan = `<span class="slide"><img src="${img_url}" alt="Word Cloud for ${year}-${getPaddedMonth(month)}" /></span>`;
      $("#carousel").append(newSpan);
    }
}

document.getElementById("next").addEventListener("click", function(){
    shiftSlide(-1);
});
document.getElementById("prev").addEventListener("click", function(){
    shiftSlide(1);
});