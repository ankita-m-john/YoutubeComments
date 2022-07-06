let youtube_api_options = {
    part: 'snippet',
    maxResults: '100',
    order: 'relevance',
    textFormat: 'plainText',
    key: 'AIzaSyCk84uaYs0NkkRpmFrKaWYmBR6_UIszRF4'
}
let filtered_comments = [];
let filtered_and_sorted_comments = [];

function get_comments(videoId){
    let fetch_string = 'https://www.googleapis.com/youtube/v3/commentThreads?';
    
    fetch_string += 'part=' + youtube_api_options.part + '&';
    fetch_string += 'maxResults=' + youtube_api_options.maxResults + '&';
    fetch_string += 'order=' + youtube_api_options.order + '&';
    fetch_string += 'textFormat=' + youtube_api_options.textFormat + '&';
    fetch_string += 'videoId=' + videoId + '&';
    fetch_string += 'key=' + youtube_api_options.key + '&';

    return $.ajax({
        url: fetch_string,
        method: 'GET',
        statusCode: {
            200: (package) => {
                parse_and_sort_comments(package);
            },
            400: () => console.log('error'),
            404: () => console.log('error')
        }
    })
}

function parse_and_sort_comments(comments)
{
    filtered_comments = comments.items.map(item => {
        return {
            author: item.snippet.topLevelComment.snippet.authorDisplayName,
            comment: item.snippet.topLevelComment.snippet.textDisplay
        }
    });

    const timestamp_regexp = new RegExp('[0-9]{0,2}:[0-9]{1,2}');
    filtered_comments.forEach(comment => {
        if (timestamp_regexp.test(comment.comment)) {
            filtered_and_sorted_comments.push({
                timestamp: comment.comment.match(timestamp_regexp)[0],
                author: comment.author,
                comment: comment.comment
            });
        }
    }); 
    filtered_and_sorted_comments = filtered_and_sorted_comments.map(comment => {
        let temp_array = [];
        let converted_into_seconds = 0.0;
        
        temp_array = comment.timestamp.split(':');
        converted_into_seconds = (parseFloat(temp_array[0]) * 60) + (parseFloat(temp_array[1]));
        return {
            timestamp: converted_into_seconds,
            author: comment.author,
            comment: comment.comment
        }
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(changeInfo.status === 'complete') {
        if(/^https:\/\/www\.youtube\.com\/watch*/.test(tab.url)){
            chrome.tabs.insertCSS(tabId, { file: 'mystyles.css'});
            chrome.tabs.executeScript(tabId, { file: 'foreground.js'})
        }
    }
});
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if(request.message === 'get_me_the_comments'){
        await get_comments(request.videoId);

        chrome.tabs.sendMessage(sender.tab.id, {message: 'here_are_your_comments', comments: filtered_and_sorted_comments});    
    }
});
//https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=100&order=relevance&textFormat=plainText&videoId=nlQUwD1r3sE&key=AIzaSyCk84uaYs0NkkRpmFrKaWYmBR6_UIszRF4