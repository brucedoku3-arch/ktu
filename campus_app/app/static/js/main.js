// Campus App Client Engine
console.log('Campus App Client Initialized.');

// Copy post or profile link to clipboard with feedback
function copyPostLink(url, btnElement) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(() => {
      showButtonFeedback(btnElement, 'Copied!');
    });
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showButtonFeedback(btnElement, 'Copied!');
    } catch (err) {
      console.error('Could not copy link', err);
    }
    document.body.removeChild(textArea);
  }
}

function showButtonFeedback(btn, text) {
  if (!btn) return;
  const original = btn.innerText;
  btn.innerText = text;
  btn.classList.add('btn-feedback-active');
  setTimeout(() => {
    btn.innerText = original;
    btn.classList.remove('btn-feedback-active');
  }, 2000);
}

// Background polling for unread direct messages badge
function checkUnreadMessages() {
  const badge = document.getElementById('navUnreadBadge');
  if (!badge) return;

  fetch('/messages/api/unread_count')
    .then((res) => {
      if (res.ok) return res.json();
      return null;
    })
    .then((data) => {
      if (data && data.unread_count > 0) {
        badge.innerText = data.unread_count > 99 ? '99+' : data.unread_count;
        badge.style.display = 'inline-flex';
      } else if (badge) {
        badge.style.display = 'none';
      }
    })
    .catch(() => {});
}

// Initial check and periodic polling every 12 seconds
document.addEventListener('DOMContentLoaded', () => {
  checkUnreadMessages();
  setInterval(checkUnreadMessages, 12000);
});
