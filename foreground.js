const query_params = new URLSearchParams(location.search);
let comments = [];
let queued_comments = [];
let current_playback_time = 0.0;
let interval_id = null;

chrome.runtime.sendMessage({message: 'get_me_the_comments', videoId: query_params.get('v')});

document.addEventListener('keyup', event => {
    if(event.key === 'a') clearInterval(interval_id);
});

function show_comment(author, comment) {
    let youtube_video = document.querySelector('.video-stream').getBoundingClientRect();
    let comment_to_be_shown = document.createElement('div');

    comment_to_be_shown.classList.add('popup-comment');

    const center = {
        x: youtube_video.left + (youtube_video.width/5),
        y: youtube_video.top + youtube_video.height
    }
    let new_x = 0.0;
    let new_y = 0.0;
    let motion_sway = 0.01;
    let natural_sway = 0.1;
    let animated_value = 0.0;

    comment_to_be_shown.style.left = '$[center.x]px';
    comment_to_be_shown.style.top = '$[center.y]px';
    comment_to_be_shown.innerText = author + ':' + comment;
    document.querySelector('body').append(comment_to_be_shown);

    let new_opacity = 0.0;
    let opacity_speed = 0.007;
    function animate() {
        new_y = center.y - animated_value;
        new_x = center.x + (60.0 * Math.sin(motion_sway * animated_value)) + natural_sway;

        comment_to_be_shown.style.top = new_y + 'px';
        comment_to_be_shown.style.left = new_x + 'px';

        new_opacity = Math.sin(opacity_speed * animated_value);

        comment_to_be_shown.style.opacity = new_opacity;

        animated_value = (animated_value + 1);

        if(comment_to_be_shown.style.opacity < 0) {
            return;
        } else {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.message === 'here_are_your_comments'){
        comments = request.comments;
        
        interval_id = setInterval(() => {
            current_playback_time = Math.floor(document.querySelector('.video-stream').currentTime);
            
            comments.forEach(comment => {
                if(current_playback_time < comment.timestamp) {
                   if(!queued_comments.includes(comment)) queued_comments.push(comment);
                }               
            });
            queued_comments.forEach(queued_comment => {
                if(current_playback_time == queued_comment.timestamp) {
                    console.log(queued_comment);
                    queued_comments.splice(queued_comments.indexOf(queued_comment), 1);
                }
            })
        }, 100);
    }
});