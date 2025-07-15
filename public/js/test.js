// Test page functionality
document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    const userIdInput = document.getElementById('userId');
    const userPasswordInput = document.getElementById('userPassword');
    let maxUserId = 100; // Updated to 100 users

    // Load configuration
    fetch('/api/config')
        .then(response => response.json())
        .then(config => {
            maxUserId = config.maxUserId;
            userIdInput.setAttribute('max', maxUserId);
            const helpText = document.querySelector('.input-group small');
            if (helpText) {
                helpText.textContent = `Please select a user ID between 1 and ${maxUserId}`;
            }
        })
        .catch(error => {
            console.error('Error loading config:', error);
        });

    // Handle form submission
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = parseInt(userIdInput.value);
        const password = userPasswordInput.value;
        
        if (!userId || isNaN(userId) || userId < 1 || userId > maxUserId) {
            alert(`Please enter a valid user ID between 1 and ${maxUserId}`);
            return;
        }
        
        if (!password || password.length !== 4) {
            alert('Please enter a 4-digit password');
            return;
        }
        
        // Validate user credentials
        fetch('/api/test/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect to user-specific test page
                window.location.href = `/test/user/${userId}`;
            } else {
                alert('Invalid user ID or password. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error validating credentials:', error);
            alert('Error validating credentials. Please try again.');
        });
    });

    // Auto-focus on user ID input
    userIdInput.focus();
    
    // Only allow numeric input for password
    userPasswordInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
});
