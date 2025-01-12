
document.addEventListener('DOMContentLoaded', async () => {
let or_tabId;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        or_tabId = activeTab.id;
    });
   
    chrome.tabs.onActivated.addListener((activeInfo) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (tab) {
                if (tab.active) {
                    console.log("Tab switched to:", tab.url);
                    if(tab.id==or_tabId){
                        document.getElementById("container").style.display = "block";
                        document.getElementById("open").style.display = "none";
                    }
                    else{
                        document.getElementById("container").style.display = "none";
                        document.getElementById("open").style.display = "block";

                        chrome.sidePanel.setOptions({
                            tabId: tab.id,
                            enabled: false,
                            path: 'sidepanel-tab.html' // Replace with your panel HTML file
                        });
                    }

                }
            }
        });
    });
    


    const commentsList = document.getElementById('commentsList');
    const newCommentText = document.getElementById('newCommentText');
    const submitComment = document.getElementById('submitComment');
    const sortCommentsButton = document.getElementById('sortComments');

    let comments = [];


    function renderComments(commentsToRender) {
        commentsList.innerHTML = ''; // Clear existing comments
        commentsToRender.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.classList.add('comment_container');
            commentCard.innerHTML = `
                <div class="comment_card">
                    <div class="comment_header">
                        <h3 class="comment_title">${comment.user_id}</h3>
                        <span class="comment_timestamp">6 hours ago</span>
                    </div>
                    <p class="comment_content">${comment.comment_content}</p>
                    <div class="comment_footer">
                        <div class="comment_actions">
                            <button class="action-button like-button" data-comment-id="${comment.id}">
                                <i class="fas fa-thumbs-up"></i> <span class="like-count">0</span>
                            </button>
                            <button class="action-button dislike-button" data-comment-id="${comment.id}">
                                <i class="fas fa-thumbs-down"></i> <span class="dislike-count">0</span>
                            </button>
                        </div>
                        <div class="show-replies" data-comment-id="${comment.id}">Replies (0)</div>
                    </div>
                </div>
                <div class="nested-comments" id="replies-${comment.id}"></div>
                <div class="reply-form">
                    <input type="text" class="reply-input" placeholder="Write a reply...">
                    <button class="reply-button" data-comment-id="${comment.id}">Reply</button>
                </div>
            `;
            commentsList.appendChild(commentCard);
        });

        // Add event listeners for likes, dislikes, and replies
        document.querySelectorAll('.like-button, .dislike-button').forEach(button => {
            button.addEventListener('click', handleVote);
        });

        document.querySelectorAll('.reply-button').forEach(button => {
            button.addEventListener('click', handleReply);
        });
    }

    function handleVote(event) {
        const button = event.currentTarget;
        const commentId = button.dataset.commentId;
        const isLike = button.classList.contains('like-button');
        const countSpan = button.querySelector('span');
        let count = parseInt(countSpan.textContent);
        count++;
        countSpan.textContent = count;

        // Here you would typically send a request to your backend to update the vote count
        console.log(`${isLike ? 'Liked' : 'Disliked'} comment ${commentId}`);
    }

    function handleReply(event) {
        const button = event.currentTarget;
        const commentId = button.dataset.commentId;
        const replyInput = button.previousElementSibling;
        const replyText = replyInput.value.trim();

        if (replyText) {
            const repliesContainer = document.getElementById(`replies-${commentId}`);
            const replyElement = document.createElement('div');
            replyElement.classList.add('comment_container');
            replyElement.innerHTML = `
                <div class="comment_card">
                    <div class="comment_header">
                        <h3 class="comment_title">User</h3>
                        <span class="comment_timestamp">Just now</span>
                    </div>
                    <p class="comment_content">${replyText}</p>
                </div>
            `;
            repliesContainer.appendChild(replyElement);
            replyInput.value = '';

            // Update reply count
            const replyCountElement = button.closest('.comment_container').querySelector('.show-replies');
            const currentCount = parseInt(replyCountElement.textContent.match(/\d+/)[0]);
            replyCountElement.textContent = `Replies (${currentCount + 1})`;

            // Here you would typically send a request to your backend to save the reply
            console.log(`Replied to comment ${commentId}: ${replyText}`);
        }
    }

    // Fetch and render comments
    async function fetchComments() {
        try {
            const response = await fetch(`http://localhost:3333/view/newest/comments/:forurl/:start/`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            const commentsData = await response.json();
            comments = commentsData.new_comments;
            renderComments(comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }

    // Handle posting a new comment
    submitComment.addEventListener('click', async () => {
        const message = newCommentText.value.trim();
        if (message === '') {
            alert('Please enter a comment');
            return;
        }

        const username = 'User'; // Replace this with actual username logic

        try {
            /*const response = await fetch('https://your-backend-url.com/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, message }),
            });*/

            //if (response.ok) {
                const newComment = {
                    id: Date.now(), // Temporary ID
                    user_id: username,
                    comment_content: message
                };
                comments.unshift(newComment);
                renderComments(comments);
                newCommentText.value = ''; // Clear the input field
           // } else {
             //   console.error('Failed to post comment');
            //}
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    });

    // Sort comments
    sortCommentsButton.addEventListener('click', () => {
        comments.reverse();
        renderComments(comments);
    });

    // Initial fetch of comments
    fetchComments();
});

