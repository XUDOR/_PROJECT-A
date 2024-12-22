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
    // Single Toggle for Both Password Fields
    // ====================================
    const passwordField = document.getElementById('signup-password');
    const confirmPasswordField = document.getElementById('signup-confirm-password');
    const togglePasswordButton = document.getElementById('toggle-password');

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
    const signupResponseDiv = document.getElementById('signup-response');  // For success/error messages

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
                signupForm.reset();

                // Optionally hide the signup section or switch back to login
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

    // ========== SINGLE PASSWORD TOGGLE FOR BOTH FIELDS ==========
    togglePasswordButton.addEventListener('click', () => {
        // Check the current type of the password field.
        const currentType = passwordField.type; // 'password' or 'text'
        const isPasswordType = (currentType === 'password');
      
        // Toggle BOTH fields to the same type.
        passwordField.type = isPasswordType ? 'text' : 'password';
        confirmPasswordField.type = isPasswordType ? 'text' : 'password';
      
        // Update the toggle button’s text accordingly.
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
        // Simulate API call or page load
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

            jobContainer.innerHTML = ''; // Clear existing content

            // Display job data (assuming just one job or adapt for multiple)
            const job = result.data;
            console.log('Job Data:', job);  // Debug

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
                    form.reset(); // Clear the form
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
});
