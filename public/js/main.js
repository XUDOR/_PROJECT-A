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
        loginForm.style.display = 'flex';
        userInfo.style.display = 'none';
        signupSection.style.display = 'none';
        // Clear account status on logout
        accountStatusDiv.innerHTML = 'No recent account activity.';
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
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = loginPasswordField.value;

        try {
            showLoading();
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            hideLoading();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                // Update UI
                userName.textContent = `Welcome, ${result.user.username}`;
                loginForm.style.display = 'none';
                userInfo.style.display = 'flex';

                // Update account status
                const statusDiv = document.createElement('div');
                statusDiv.classList.add('bundle-row');
                statusDiv.innerHTML = `
                    <div class="bundle-content">
                        Successful login for ${result.user.username}
                        <div class="bundle-timestamp">
                            <span class="timestamp-label">Login Time:</span>
                            <span class="timestamp-value">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                `;
                accountStatusDiv.innerHTML = '';
                accountStatusDiv.appendChild(statusDiv);
            } else {
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
            }
        } catch (error) {
            hideLoading();
            console.error('Login error:', error);
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

            try {
                showLoading();
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user),
                });

                const result = await response.json();
                hideLoading();

                if (response.ok) {
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
                    responseDiv.textContent = `Error: ${result.error}`;
                    responseDiv.style.color = 'red';
                }
            } catch (error) {
                hideLoading();
                responseDiv.textContent = 'Failed to submit user.';
                responseDiv.style.color = 'red';
                console.error('Error:', error.message);
            }
        });
    }

    // ========== CHECK AND RESTORE LOGIN STATE ==========
    function checkLoginState() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (token && user) {
            userName.textContent = `Welcome, ${user.username}`;
            loginForm.style.display = 'none';
            userInfo.style.display = 'flex';
            
            // Update account status
            const statusDiv = document.createElement('div');
            statusDiv.classList.add('bundle-row');
            statusDiv.innerHTML = `
                <div class="bundle-content">
                    Session restored for ${user.username}
                    <div class="bundle-timestamp">
                        <span class="timestamp-label">Time:</span>
                        <span class="timestamp-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            `;
            accountStatusDiv.innerHTML = '';
            accountStatusDiv.appendChild(statusDiv);
        }
    }

    // Check login state on page load
    checkLoginState();
});