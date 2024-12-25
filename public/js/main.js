document.addEventListener('DOMContentLoaded', function () {
    // ====================================
    // Authentication Elements
    // ====================================
    const loginForm = document.getElementById('login-form');
    const signupSection = document.getElementById('signup-section');
    const showSignupBtn = document.getElementById('show-signup');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // ====================================
    // Password Fields and Toggles
    // ====================================
    const passwordField = document.getElementById('signup-password');
    const confirmPasswordField = document.getElementById('signup-confirm-password');
    const togglePasswordButton = document.getElementById('toggle-password');
    const loginPasswordField = document.getElementById('login-password');
    const toggleLoginPasswordButton = document.getElementById('toggle-login-password');
    const accountStatusDiv = document.getElementById('account-status');

    // ====================================
    // Navigation & Loading Elements
    // ====================================
    const navLinks = document.querySelectorAll('.nav-menu a');
    const loadingIndicator = document.querySelector('.loading');

    // ====================================
    // "Submit User" Form Elements (Profile)
    // ====================================
    const form = document.getElementById('user-form');
    const responseDiv = document.getElementById('form-response');
    const jobContainer = document.getElementById('job-container');
    const refreshJobsButton = document.getElementById('refresh-jobs-btn');

    // ====================================
    // Signup Form & Response
    // ====================================
    const signupForm = document.getElementById('signup-form');
    const signupResponseDiv = document.getElementById('signup-response');

    // ========== AUTH EVENT LISTENERS ==========

    // Show Signup
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupSection.style.display = 'block';
        loginForm.style.display = 'none';
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Reset UI
        loginForm.style.display = 'flex';
        userInfo.style.display = 'none';
        signupSection.style.display = 'none';
        accountStatusDiv.innerHTML = 'No recent account activity.';

        // Remove logged-in-specific styling
        userInfo.classList.remove('logged-in-style');
    });


    // ========== LOGIN PASSWORD TOGGLE ==========
    toggleLoginPasswordButton.addEventListener('click', () => {
        const currentType = loginPasswordField.type;
        loginPasswordField.type = currentType === 'password' ? 'text' : 'password';
        toggleLoginPasswordButton.textContent = currentType === 'password' ? 'Hide' : 'View';
    });

    // ========== SIGNUP FORM SUBMISSION ==========
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Collect user input
        const username = document.getElementById('signup-username').value.trim();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        const accountType = document.getElementById('account-type').value;

        // Basic validation
        if (!username || !name || !email || !password || !accountType) {
            signupResponseDiv.textContent = 'Please fill in all required fields.';
            signupResponseDiv.style.color = 'red';
            return;
        }
        if (password !== confirmPassword) {
            signupResponseDiv.textContent = 'Passwords do not match.';
            signupResponseDiv.style.color = 'red';
            return;
        }

        try {
            showLoading();

            console.log('Sending signup data:', {
                username,
                name,
                email,
                password: '***',
                accountType
            });

            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    name,
                    email,
                    password,
                    accountType
                }),
            });

            const result = await response.json();

            hideLoading();

            if (response.ok) {
                // Show success
                signupResponseDiv.textContent = 'Account created successfully!';
                signupResponseDiv.style.color = 'green';

                // Update account status
                const statusDiv = document.createElement('div');
                statusDiv.classList.add('bundle-row');
                statusDiv.innerHTML = `
                    <div class="bundle-content">
                        Account created for ${username}
                        <div class="bundle-timestamp">
                            <span class="timestamp-label">Created:</span>
                            <span class="timestamp-value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                `;
                accountStatusDiv.innerHTML = '';
                accountStatusDiv.appendChild(statusDiv);

                signupForm.reset();
                // Hide signup, show login
                signupSection.style.display = 'none';
                loginForm.style.display = 'flex';
            } else {
                signupResponseDiv.textContent = `Failed to create account: ${result.error || 'Unknown error'}`;
                signupResponseDiv.style.color = 'red';
            }
        } catch (error) {
            hideLoading();
            console.error('Signup error:', error.message);
            signupResponseDiv.textContent = 'An unexpected error occurred.';
            signupResponseDiv.style.color = 'red';
        }
    });

    // ========== LOGIN FORM SUBMISSION ==========
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('[LOGIN] Login attempt started');

        const email = document.getElementById('login-email').value;
        const password = loginPasswordField.value;

        console.log('=== LOGIN ATTEMPT START ===');
        console.log('Email:', email);

        try {
            showLoading();
            // Notify F that login attempt started
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Login attempt initiated for ${email}`,
                    status: 'info',
                    source: 'Project A',
                    timestamp: new Date().toISOString()
                })
            });

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            hideLoading();

            if (response.ok) {
                console.log('[LOGIN] Login successful');
                // Store auth data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Update UI
                userName.textContent = `Welcome, ${result.user.username}`;
                loginForm.style.display = 'none';
                userInfo.style.display = 'flex';

                // Add logged-in-specific styling
                userInfo.classList.add('logged-in-style');

                // Update account status
                const statusDiv = document.createElement('div');
                statusDiv.classList.add('bundle-row');
                statusDiv.innerHTML = `
                <div class="bundle-content">
                    <span style="color: #0AAAC3; font-weight: bold;">Login Successful</span>
                    <div>User: ${result.user.username}</div>
                    <div class="bundle-timestamp">
                        <span class="timestamp-label">Login Time:</span>
                        <span class="timestamp-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            `;
                accountStatusDiv.innerHTML = '';
                accountStatusDiv.appendChild(statusDiv);

                // Notify F of successful login
                await fetch('/api/notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.token}`
                    },
                    body: JSON.stringify({
                        message: `Login successful for ${result.user.username}`,
                        status: 'success',
                        source: 'Project A',
                        details: {
                            username: result.user.username,
                            timestamp: new Date().toISOString()
                        }
                    })
                });
            } else {
                console.log('[LOGIN] Login failed:', result.error);
                const errorDiv = document.createElement('div');
                errorDiv.classList.add('bundle-row');
                errorDiv.innerHTML = `
                <div class="bundle-content" style="color: #ff4d4d;">
                    Login failed: ${result.error}
                    <div class="bundle-timestamp">
                        <span class="timestamp-label">Time:</span>
                        <span class="timestamp-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            `;
                accountStatusDiv.innerHTML = '';
                accountStatusDiv.appendChild(errorDiv);

                // Notify F of failed login
                await fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Login failed for ${email}`,
                        status: 'error',
                        source: 'Project A',
                        details: {
                            error: result.error,
                            timestamp: new Date().toISOString()
                        }
                    })
                });
            }
        } catch (error) {
            hideLoading();
            console.error('[LOGIN] Error:', error);
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('bundle-row');
            errorDiv.innerHTML = `
            <div class="bundle-content" style="color: #ff4d4d;">
                Login error: ${error.message}
                <div class="bundle-timestamp">
                    <span class="timestamp-label">Time:</span>
                    <span class="timestamp-value">${new Date().toLocaleString()}</span>
                </div>
            </div>
        `;
            accountStatusDiv.innerHTML = '';
            accountStatusDiv.appendChild(errorDiv);

            // Notify F of error
            await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Login system error for ${email}`,
                    status: 'error',
                    source: 'Project A',
                    details: {
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }
                })
            });
        }
    });

    // ========== PASSWORD TOGGLES ==========
    togglePasswordButton.addEventListener('click', () => {
        const currentType = passwordField.type;
        const isPasswordType = (currentType === 'password');

        passwordField.type = isPasswordType ? 'text' : 'password';
        confirmPasswordField.type = isPasswordType ? 'text' : 'password';

        togglePasswordButton.textContent = isPasswordType ? 'Hide' : 'View';
    });

    // ========== NAVIGATION HANDLING ==========
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.dataset.section;
            handleNavigation(section);
        });
    });

    function handleNavigation(section) {
        showLoading();
        setTimeout(() => {
            hideLoading();
            updateContent(section);
        }, 1000);
    }

    function showLoading() {
        loadingIndicator.style.display = 'block';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    function updateContent(section) {
        console.log(`Navigating to ${section}`);
    }

    // ========== JOB DATA FETCH ==========
    async function fetchJobs() {
        try {
            showLoading();
            const response = await fetch('/api/receive-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch jobs');
            }

            jobContainer.innerHTML = '';

            const job = result.data;
            console.log('Job Data:', job);

            const jobDiv = document.createElement('div');
            jobDiv.classList.add('job-row');
            jobDiv.innerHTML = `
                <h3>${job.job_title}</h3>
                <p><strong>Company:</strong> ${job.company_name}</p>
                <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
                <p><strong>Skills:</strong> ${Array.isArray(job.skills_required) ? job.skills_required.join(', ') : 'N/A'}</p>
                <p><strong>Description:</strong> ${job.job_description || 'N/A'}</p>
            `;
            jobContainer.appendChild(jobDiv);

            hideLoading();
        } catch (error) {
            console.error('Error fetching jobs:', error.message);
            jobContainer.textContent = 'Failed to load jobs.';
            hideLoading();
        }
    }

    if (refreshJobsButton) {
        refreshJobsButton.addEventListener('click', fetchJobs);
    }

    // ========== PROFILE FORM SUBMISSION (/api/users) ==========
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            console.log('Form submission started');

            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (!token) {
                responseDiv.textContent = 'Please log in to submit your profile.';
                responseDiv.style.color = 'red';
                console.log('Submission blocked: No auth token found');
                return;
            }

            const formData = new FormData(form);
            const user = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                location: formData.get('location'),
                skills: formData.get('skills') ? formData.get('skills').split(',') : [],
                profile_summary: formData.get('profile_summary'),
            };

            console.log('Submitting user data:', user);

            try {
                showLoading();
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Add token to headers
                    },
                    body: JSON.stringify(user),
                });

                console.log('Response status:', response.status);

                // Log raw response for debugging
                const rawResponse = await response.text();
                console.log('Raw response:', rawResponse);

                let result;
                try {
                    // Try to parse the response as JSON
                    result = JSON.parse(rawResponse);
                } catch (parseError) {
                    console.error('Failed to parse response as JSON:', parseError);
                    throw new Error('Invalid response format from server');
                }

                hideLoading();

                if (response.ok) {
                    console.log('Submission successful:', result);
                    responseDiv.textContent = 'User submitted successfully!';
                    responseDiv.style.color = 'green';

                    // Update account status
                    const statusDiv = document.createElement('div');
                    statusDiv.classList.add('bundle-row');
                    statusDiv.innerHTML = `
                    <div class="bundle-content">
                        Profile updated for ${user.name}
                        <div class="bundle-timestamp">
                            <span class="timestamp-label">Updated:</span>
                            <span class="timestamp-value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                `;
                    accountStatusDiv.innerHTML = '';
                    accountStatusDiv.appendChild(statusDiv);

                    form.reset();
                } else {
                    console.error('Submission failed:', result);
                    responseDiv.textContent = `Error: ${result.error || 'Unknown error occurred'}`;
                    responseDiv.style.color = 'red';
                }
            } catch (error) {
                hideLoading();
                console.error('Submission error:', error);
                responseDiv.textContent = `Failed to submit user: ${error.message}`;
                responseDiv.style.color = 'red';

                // Additional error details
                if (error.response) {
                    console.error('Error response:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        headers: Object.fromEntries(error.response.headers.entries())
                    });
                }
            }
        });
    }
    // ========== CHECK AND RESTORE LOGIN STATE ==========
    function checkLoginState() {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || 'null');

            if (token && user) {
                // Update UI elements
                userName.textContent = `Welcome, ${user.username}`;
                loginForm.style.display = 'none';
                userInfo.style.display = 'flex';

                // Update account status with enhanced styling
                const statusDiv = document.createElement('div');
                statusDiv.classList.add('bundle-row');
                statusDiv.innerHTML = `
                <div class="bundle-content">
                    <span style="color: #0AAAC3; font-weight: bold;">Active Session</span>
                    <div>User: ${user.username}</div>
                    <div class="bundle-timestamp">
                        <span class="timestamp-label">Session Started:</span>
                        <span class="timestamp-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            `;
                accountStatusDiv.innerHTML = '';
                accountStatusDiv.appendChild(statusDiv);

                // [NEW] Notify Project F about session restoration
                fetch('/api/notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: `Session restored for ${user.username}`,
                        status: 'info',
                        source: 'Project A',
                        timestamp: new Date().toISOString()
                    })
                }).catch(error => console.error('Failed to notify Project F:', error));

            } else {
                // [NEW] Clear UI state if no valid session
                userName.textContent = '';
                loginForm.style.display = 'flex';
                userInfo.style.display = 'none';
                accountStatusDiv.innerHTML = `
                <div class="bundle-row">
                    <div class="bundle-content" style="color: #C6D000;">
                        No active session
                        <div class="bundle-timestamp">
                            <span class="timestamp-label">Checked:</span>
                            <span class="timestamp-value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
            }
        } catch (error) {
            console.error('Error checking login state:', error);
            // [NEW] Handle corrupted storage data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            accountStatusDiv.innerHTML = `
            <div class="bundle-row">
                <div class="bundle-content" style="color: #ff4d4d;">
                    Session error occurred
                    <div class="bundle-timestamp">
                        <span class="timestamp-label">Time:</span>
                        <span class="timestamp-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
        }
    }

    // Check login state on page load
    checkLoginState();
});