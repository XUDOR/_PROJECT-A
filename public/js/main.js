document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const navLinks = document.querySelectorAll('.nav-menu a');
    const loadingIndicator = document.querySelector('.loading');
    const form = document.getElementById('user-form');
    const responseDiv = document.getElementById('form-response');
    const jobContainer = document.getElementById('job-container');
    const refreshJobsButton = document.getElementById('refresh-jobs-btn');

    // Navigation handling
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.dataset.section;
            handleNavigation(section);
        });
    });

    // Handle navigation with loading state
    function handleNavigation(section) {
        showLoading();

        // Simulate API call or page load
        setTimeout(() => {
            hideLoading();
            updateContent(section);
        }, 1000);
    }

    // Loading state functions
    function showLoading() {
        loadingIndicator.style.display = 'block';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    // Update content based on section
    function updateContent(section) {
        console.log(`Navigating to ${section}`);
    }

    // Function to fetch and display job data
    async function fetchJobs() {
        try {
            showLoading();
            const response = await fetch('/api/receive-jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch jobs');
            }
    
            // Clear existing content
            jobContainer.innerHTML = '';
    
            // Display the job data
            const job = result.data;
            console.log('Job Data:', job);  // Debugging line
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
    
    

    // Attach event listener to the refresh button
    if (refreshJobsButton) {
        refreshJobsButton.addEventListener('click', fetchJobs);
    }

    // Form submission handling
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault(); // Prevent default form submission

            // Collect form data
            const formData = new FormData(form);
            const user = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                location: formData.get('location'),
                skills: formData.get('skills') ? formData.get('skills').split(',') : [], // Convert to array
                profile_summary: formData.get('profile_summary'),
            };

            try {
                showLoading();

                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(user),
                });

                const result = await response.json();

                hideLoading();

                if (response.ok) {
                    responseDiv.textContent = 'User submitted successfully!';
                    responseDiv.style.color = 'green';
                    form.reset(); // Clear the form fields
                    
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
