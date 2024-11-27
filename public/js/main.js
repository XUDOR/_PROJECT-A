document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const navLinks = document.querySelectorAll('.nav-menu a');
    const loadingIndicator = document.querySelector('.loading');
    const form = document.getElementById('user-form');
    const responseDiv = document.getElementById('form-response');

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
        // Here you would typically update the page content
        // based on the selected section
    }

    // Responsive handling
    let resizeTimer;
    window.addEventListener('resize', function () {
        // Debounce resize events
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Handle any responsive adjustments here
            console.log('Window resized - layout adjusted');
        }, 250);
    });

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
                // Show loading indicator
                showLoading();

                // Send data to backend
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(user),
                });

                const result = await response.json();

                // Hide loading indicator
                hideLoading();

                // Handle response
                if (response.ok) {
                    responseDiv.textContent = 'User submitted successfully!';
                    responseDiv.style.color = 'green';
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
