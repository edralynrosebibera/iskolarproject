document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialization and Element Setup
    lucide.createIcons();

    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const formActions = document.getElementById("formActions");
    const profileForm = document.getElementById("profileForm");

    const profileAvatar = document.getElementById("profileAvatar");
    const avatarEditIcon = document.getElementById("avatarEditIcon");
    const avatarInput = document.getElementById("avatarInput");

    // Display elements
    const displayName = document.getElementById("displayName");
    const displayMajor = document.getElementById("displayMajor");
    const displayEmail = document.getElementById("displayEmail");
    const displayPhone = document.getElementById("displayPhone");
    const displayLocation = document.getElementById("displayLocation");
    const displayGraduation = document.getElementById("displayGraduation");

    // Form inputs
    const yearLevel = document.getElementById("yearLevel");
    const course = document.getElementById("course");

    let isEditing = false;

    // 2. State Toggling Functions
    const disableForm = (disabled) => {
        profileForm.querySelectorAll("input, select, textarea").forEach(input => input.disabled = disabled);
    };

    const toggleFormState = (editing) => {
        disableForm(!editing);
        formActions.style.display = editing ? "flex" : "none";
        editBtn.style.display = editing ? "none" : "flex";
        isEditing = editing;

        // Lock/unlock avatar edit icon
        avatarEditIcon.style.pointerEvents = editing ? "auto" : "none";
        avatarEditIcon.style.opacity = editing ? "1" : "0.5";
    };
    
    // --- PROFILE COMPLETENESS FUNCTIONS (NEW) ---

    const updateMissingInfoList = (profileData) => {
        const missingItems = [];
        // Define key fields and the criteria to check for their completeness
        const checks = {
            'Upload Profile Photo': (data) => data.avatar && data.avatar.includes('url('),
            'Address': (data) => data.address && data.address.trim() !== '',
            'Birthdate': (data) => data.birthdate && data.birthdate.trim() !== '',
            'GPA/GWA': (data) => data.gwa && data.gwa.trim() !== '',
            'Complete Bio': (data) => data.bio && data.bio.trim().length >= 20, // Require 20+ chars
            // Check other mandatory fields
            'Year Level & Course': (data) => data.yearLevel && data.yearLevel.trim() !== '' && data.course && data.course.trim() !== '',
        };

        for (const [name, isComplete] of Object.entries(checks)) {
            if (!isComplete(profileData)) {
                missingItems.push(name);
            }
        }

        const missingInfoUl = document.querySelector('.missing-info ul');
        if (missingInfoUl) {
            // Update the list visually
            missingInfoUl.innerHTML = missingItems.map(item => `<li>${item}</li>`).join('');
        }
    };
    
    const updateProfileCompleteness = (profileData) => {
        // Total points available for mandatory fields
        const totalPoints = 12; // Example total (adjust this based on your complete list)
        let earnedPoints = 0;

        // 1. Basic Personal Info (7 points)
        if (profileData.firstName && profileData.firstName.trim() !== '') earnedPoints++;
        if (profileData.lastName && profileData.lastName.trim() !== '') earnedPoints++;
        if (profileData.email && profileData.email.trim() !== '') earnedPoints++;
        if (profileData.phone && profileData.phone.trim() !== '') earnedPoints++;
        if (profileData.address && profileData.address.trim() !== '') earnedPoints++;
        if (profileData.birthdate && profileData.birthdate.trim() !== '') earnedPoints++;
        if (profileData.gender && profileData.gender.trim() !== '') earnedPoints++; // Gender radio button

        // 2. Educational Info (3 points)
        if (profileData.course && profileData.course.trim() !== '') earnedPoints++;
        if (profileData.yearLevel && profileData.yearLevel.trim() !== '') earnedPoints++;
        if (profileData.gwa && profileData.gwa.trim() !== '') earnedPoints++;

        // 3. Media & Bio (2 points)
        if (profileData.avatar && profileData.avatar.includes('url(')) earnedPoints++;
        if (profileData.bio && profileData.bio.trim().length >= 20) earnedPoints++; 

        const completeness = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));

        // Update the HTML display elements
        document.getElementById("completenessPercent").textContent = `${completeness}%`;
        document.getElementById("completenessBar").style.width = `${completeness}%`;
        
        updateMissingInfoList(profileData);

        console.log(`📊 Profile completeness calculated: ${completeness}% (${earnedPoints}/${totalPoints} fields).`);
    };

    // 3. Persistence Functions
    const saveProfileToLocalStorage = () => {
        const profileData = {};
        
        // Save all form input values
        profileForm.querySelectorAll("input, select, textarea").forEach(input => {
            if (input.type === 'radio' && !input.checked) return;
            profileData[input.id] = input.value;
        });

        // Save radio button states manually
        profileData.gender = document.querySelector('input[name="gender"]:checked')?.value || "";
        profileData.citizenship = document.querySelector('input[name="citizenship"]:checked')?.value || "";

        // Save the avatar URL string
        profileData.avatar = profileAvatar.style.backgroundImage || "";

        try {
            localStorage.setItem("userProfile", JSON.stringify(profileData));
            console.log("✅ Profile data saved successfully to Local Storage.");
            return profileData; // Return the saved data
        } catch (e) {
            console.error("❌ Error saving to Local Storage:", e);
            alert("Could not save profile. Local Storage may be full or disabled.");
            return profileData;
        }
    };

    const loadProfileFromLocalStorage = () => {
        const savedDataJson = localStorage.getItem("userProfile");
        
        // Get initial form values as a fallback/default
        const initialData = {};
        profileForm.querySelectorAll("input, select, textarea").forEach(input => {
            if (input.type !== 'radio' || input.checked) {
                initialData[input.id] = input.value;
            }
        });

        if (!savedDataJson) {
            console.log("ℹ️ No profile data found in Local Storage. Using default HTML values.");
            
            // Populate display elements and completeness from initial HTML values
            updateDisplayElements();
            updateProfileCompleteness(initialData); 
            return;
        }

        const savedData = JSON.parse(savedDataJson);
        console.log("✅ Profile data loaded from Local Storage.");

        // A. Restore form inputs
        profileForm.querySelectorAll("input, select, textarea").forEach(input => {
            if (savedData[input.id] !== undefined) {
                if (input.type === 'radio') {
                    if (input.value === savedData[input.name]) {
                        input.checked = true;
                    }
                } else {
                    input.value = savedData[input.id];
                }
            }
        });
        
        // B. Restore avatar
        if (savedData.avatar && savedData.avatar.includes('url(')) {
            profileAvatar.style.backgroundImage = savedData.avatar;
            profileAvatar.innerHTML = "";
        } else {
            const currentFirstName = document.getElementById("firstName")?.value || "";
            const currentLastName = document.getElementById("lastName")?.value || "";
            const initials = (currentFirstName[0] || '') + (currentLastName[0] || '');
            profileAvatar.style.backgroundImage = 'none';
            profileAvatar.innerHTML = initials.toUpperCase() || 'AJ';
        }

        // C. Update display elements and completeness score
        updateDisplayElements();
        updateProfileCompleteness(savedData); 
    };
    
    // 4. Dedicated function to update display elements from the current form values
    const updateDisplayElements = () => {
        const currentFirstName = document.getElementById("firstName")?.value.trim() || "";
        const currentLastName = document.getElementById("lastName")?.value.trim() || "";
        const currentCourse = document.getElementById("course")?.value || "";
        const currentEmail = document.getElementById("email")?.value || "";
        const currentPhone = document.getElementById("phone")?.value || "";
        const currentAddress = document.getElementById("address")?.value || "";
        
        const graduationYearText = yearLevel.options[yearLevel.selectedIndex]?.text || "";
        const graduationYear = graduationYearText.match(/\d{4}/)?.[0] || "";

        // Update display elements
        displayName.textContent = `${currentFirstName} ${currentLastName}`;
        displayMajor.textContent = currentCourse;
        displayEmail.textContent = currentEmail;
        displayPhone.textContent = currentPhone;
        displayLocation.textContent = currentAddress;
        displayGraduation.textContent = `Class of ${graduationYear}`;
        
        // Update avatar initials if no custom avatar is set
        if (!profileAvatar.style.backgroundImage) {
            const initials = (currentFirstName[0] || '') + (currentLastName[0] || '');
            profileAvatar.innerHTML = initials.toUpperCase() || 'AJ';
        }
    }


    // 5. Avatar Upload Logic
    avatarEditIcon.style.pointerEvents = "none";
    avatarEditIcon.style.opacity = "0.5";

    avatarEditIcon.addEventListener("click", () => {
        if (!isEditing) return;
        avatarInput.click();
    });

    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (ev) {
            profileAvatar.style.backgroundImage = `url(${ev.target.result})`;
            profileAvatar.innerHTML = "";
            // Immediately save the profile data to persist the avatar change
            const profileData = saveProfileToLocalStorage();
            updateProfileCompleteness(profileData);
        };
        reader.readAsDataURL(file);
    });

    // 6. Button Event Handlers
    editBtn.addEventListener("click", () => {
        toggleFormState(true);
    });

    saveBtn.addEventListener("click", () => {
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();

        if (!firstName || !lastName) {
            alert("First Name and Last Name are required.");
            return;
        }

        // Update display elements 
        updateDisplayElements(); 

        // Save data and get the saved profileData object
        const profileData = saveProfileToLocalStorage();
        
        // Update completeness based on the newly saved data
        updateProfileCompleteness(profileData);

        toggleFormState(false);
    });

    cancelBtn.addEventListener("click", () => {
        // Loads the last SAVED data, resetting any unsaved changes in the form
        loadProfileFromLocalStorage();
        toggleFormState(false);
    });

    // 7. Initialize: This MUST run on page load
    loadProfileFromLocalStorage();
    toggleFormState(false);
});