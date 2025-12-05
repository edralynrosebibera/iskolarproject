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

    // --- NEW --- Selectors for education level functionality
    const educationButtons = document.querySelectorAll(".education-buttons .edu-btn");
    const yearLevelLabel = document.querySelector('label[for="yearLevel"]');
    const courseGroup = document.querySelector('label[for="course"]').closest('.form-group');

    let isEditing = false;

    // --- NEW --- Options for the dynamic year level dropdown
    const yearLevelOptions = {
        "JUNIOR HIGH": [
            { value: "7", text: "Grade 7" },
            { value: "8", text: "Grade 8" },
            { value: "9", text: "Grade 9" },
            { value: "10", text: "Grade 10" }
        ],
        "SENIOR HIGH": [
            { value: "11", text: "Grade 11" },
            { value: "12", text: "Grade 12" }
        ],
        "COLLEGE": [
            { value: "2027", text: "1st Year (2027)" },
            { value: "2026", text: "2nd Year (2026)" },
            { value: "2025", text: "3rd Year (2025)" },
            { value: "2024", text: "4th Year (2024)" }
            // Add more college years if needed
        ]
    };

    // 2. State Toggling Functions
    
    // --- MODIFIED --- Added ".edu-btn" to the querySelectorAll
    const disableForm = (disabled) => {
        profileForm.querySelectorAll("input, select, textarea, .edu-btn").forEach(el => el.disabled = disabled);
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

    // --- NEW --- Function to update the year level dropdown
    const updateYearLevelOptions = (level) => {
        const options = yearLevelOptions[level]; // Get the array of options for the selected level

        // Clear current options
        yearLevel.innerHTML = ''; 

        // Add a placeholder
        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.text = "Select Year";
        placeholder.disabled = true;
        placeholder.selected = true;
        yearLevel.appendChild(placeholder);

        // Populate new options
        if (options) {
            options.forEach(opt => {
                const optionElement = document.createElement("option");
                optionElement.value = opt.value;
                optionElement.textContent = opt.text;
                yearLevel.appendChild(optionElement);
            });
        }

        // --- NEW --- Also update the label and show/hide the "Course" field
        if (level === "COLLEGE") {
            yearLevelLabel.textContent = "Year Level";
            courseGroup.style.display = "block"; // Show "College Course / Major"
        } else {
            yearLevelLabel.textContent = "Grade Level";
            courseGroup.style.display = "none"; // Hide "College Course / Major"
        }
    };
    
    // 3. Profile Completeness Functions
    // Replace your existing updateMissingInfoList function with this:

const updateMissingInfoList = (profileData) => {
    const missingItems = [];
    
    // Define checks
    const checks = {
        'Upload Profile Photo': (data) => data.avatar && data.avatar.includes('url('),
        'Address': (data) => data.address && data.address.trim() !== '',
        'Birthdate': (data) => data.birthdate && data.birthdate.trim() !== '',
        'GPA/GWA': (data) => data.gwa && data.gwa.trim() !== '',
        'Complete Bio': (data) => data.bio && data.bio.trim().length >= 20, 
        'Year Level': (data) => data.yearLevel && data.yearLevel.trim() !== '',
    };

    if (profileData.educationLevel === "COLLEGE") {
        checks['College Course'] = (data) => data.course && data.course.trim() !== '';
    }

    for (const [name, isComplete] of Object.entries(checks)) {
        if (!isComplete(profileData)) {
            missingItems.push(name);
        }
    }

    // --- THE FIX ---
    const missingInfoContainer = document.querySelector('.missing-info');

    if (missingInfoContainer) {
        if (missingItems.length === 0) {
            // 1. Clear the inner HTML so the text "Missing Information" is physically gone
            missingInfoContainer.innerHTML = ''; 
            // 2. Hide the box
            missingInfoContainer.style.display = 'none';
        } else {
            // Restore the box if items are missing
            missingInfoContainer.style.display = 'block';
            missingInfoContainer.innerHTML = `
                <p><strong>Missing Information:</strong></p>
                <ul>
                    ${missingItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
        }
    }
};
    
    const updateProfileCompleteness = (profileData) => {
        let totalPoints = 11; // Base points
        let earnedPoints = 0;

        // 1. Basic Personal Info (7 points)
        if (profileData.firstName && profileData.firstName.trim() !== '') earnedPoints++;
        if (profileData.lastName && profileData.lastName.trim() !== '') earnedPoints++;
        if (profileData.email && profileData.email.trim() !== '') earnedPoints++;
        if (profileData.phone && profileData.phone.trim() !== '') earnedPoints++;
        if (profileData.address && profileData.address.trim() !== '') earnedPoints++;
        if (profileData.birthdate && profileData.birthdate.trim() !== '') earnedPoints++;
        if (profileData.gender && profileData.gender.trim() !== '') earnedPoints++; // Gender radio button

        // 2. Educational Info (2 points base, +1 for college)
        if (profileData.yearLevel && profileData.yearLevel.trim() !== '') earnedPoints++;
        if (profileData.gwa && profileData.gwa.trim() !== '') earnedPoints++;
        
        // --- MODIFIED --- Only count 'course' if College is selected
        if (profileData.educationLevel === "COLLEGE") {
            totalPoints++; // Add 1 to total points if college
            if (profileData.course && profileData.course.trim() !== '') earnedPoints++;
        }

        // 3. Media & Bio (2 points)
        if (profileData.avatar && profileData.avatar.includes('url(')) earnedPoints++;
        if (profileData.bio && profileData.bio.trim().length >= 20) earnedPoints++; 

        const completeness = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));

        document.getElementById("completenessPercent").textContent = `${completeness}%`;
        document.getElementById("completenessBar").style.width = `${completeness}%`;
        
        updateMissingInfoList(profileData);

        console.log(`📊 Profile completeness calculated: ${completeness}% (${earnedPoints}/${totalPoints} fields).`);
    };

    // 4. Persistence Functions
    const saveProfileToLocalStorage = () => {
        const profileData = {};
        
        profileForm.querySelectorAll("input, select, textarea").forEach(input => {
            if (input.type === 'radio' && !input.checked) return;
            profileData[input.id] = input.value;
        });

        profileData.gender = document.querySelector('input[name="gender"]:checked')?.value || "";
        profileData.citizenship = document.querySelector('input[name="citizenship"]:checked')?.value || "";
        profileData.avatar = profileAvatar.style.backgroundImage || "";

        // --- NEW --- Save the active education level
        const activeEduBtn = document.querySelector(".education-buttons .edu-btn.active");
        profileData.educationLevel = activeEduBtn ? activeEduBtn.textContent.trim() : "COLLEGE";

        try {
            localStorage.setItem("userProfile", JSON.stringify(profileData));
            console.log("✅ Profile data saved successfully to Local Storage.");
            return profileData;
        } catch (e) {
            console.error("❌ Error saving to Local Storage:", e);
            alert("Could not save profile. Local Storage may be full or disabled.");
            return profileData;
        }
    };

    const loadProfileFromLocalStorage = () => {
        const savedDataJson = localStorage.getItem("userProfile");
        
        const initialData = {};
        profileForm.querySelectorAll("input, select, textarea").forEach(input => {
            if (input.type !== 'radio' || input.checked) {
                initialData[input.id] = input.value;
            }
        });
        // --- NEW --- Get initial education level from the active button in HTML
        initialData.educationLevel = document.querySelector(".education-buttons .edu-btn.active")?.textContent.trim() || "COLLEGE";
        initialData.avatar = profileAvatar.style.backgroundImage || "";


        if (!savedDataJson) {
            console.log("ℹ️ No profile data found in Local Storage. Using default HTML values.");
            
            // --- NEW --- Ensure correct year levels are shown for the default (COLLEGE)
            updateYearLevelOptions(initialData.educationLevel);
            updateDisplayElements();
            updateProfileCompleteness(initialData); 
            return;
        }

        const savedData = JSON.parse(savedDataJson);
        console.log("✅ Profile data loaded from Local Storage.");

        // --- NEW --- Load education level *first*
        const savedLevel = savedData.educationLevel || "COLLEGE";
        
        // 1. Set the active button
        educationButtons.forEach(btn => {
            if (btn.textContent.trim() === savedLevel) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 2. Populate the year level options *before* setting the form values
        updateYearLevelOptions(savedLevel);

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
        updateProfileCompleteness(savedData); // Pass the loaded data
    };
    
    // 5. Dedicated function to update display elements from the current form values
    const updateDisplayElements = () => {
        const currentFirstName = document.getElementById("firstName")?.value.trim() || "";
        const currentLastName = document.getElementById("lastName")?.value.trim() || "";
        const currentCourse = document.getElementById("course")?.value || "";
        const currentEmail = document.getElementById("email")?.value || "";
        const currentPhone = document.getElementById("phone")?.value || "";
        const currentAddress = document.getElementById("address")?.value || "";
        
        // --- MODIFIED --- This logic is now more generic
        const graduationYearText = yearLevel.options[yearLevel.selectedIndex]?.text || "";
        let graduationDisplay = "N/A";

        if (graduationYearText.includes("Year")) { // College
             const graduationYear = graduationYearText.match(/\d{4}/)?.[0] || "";
             graduationDisplay = `Class of ${graduationYear}`;
        } else if (graduationYearText.includes("Grade")) { // JHS/SHS
            graduationDisplay = graduationYearText;
        }

        // Update display elements
        displayName.textContent = `${currentFirstName} ${currentLastName}`;
        displayMajor.textContent = currentCourse;
        displayEmail.textContent = currentEmail;
        displayPhone.textContent = currentPhone;
        displayLocation.textContent = currentAddress;
        displayGraduation.textContent = graduationDisplay;
        
        if (!profileAvatar.style.backgroundImage) {
            const initials = (currentFirstName[0] || '') + (currentLastName[0] || '');
            profileAvatar.innerHTML = initials.toUpperCase() || 'AJ';
        }
    }


    // 6. Avatar Upload Logic
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
            const profileData = saveProfileToLocalStorage();
            updateProfileCompleteness(profileData);
        };
        reader.readAsDataURL(file);
    });

    // --- NEW --- 7. Education Level Button Logic
    educationButtons.forEach(button => {
        button.addEventListener("click", () => {
            // 1. Handle the 'active' class
            educationButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // 2. Get the level from the button's text
            const selectedLevel = button.textContent.trim(); 

            // 3. Call the update function
            updateYearLevelOptions(selectedLevel);

            // 4. If switching away from college, clear the course field
            if (selectedLevel !== "COLLEGE") {
                course.value = "";
            }
        });
    });

    // 8. Button Event Handlers (Save, Cancel, Edit)
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

        updateDisplayElements(); 
        const profileData = saveProfileToLocalStorage();
        updateProfileCompleteness(profileData);
        toggleFormState(false);
    });

    cancelBtn.addEventListener("click", () => {
        loadProfileFromLocalStorage();
        toggleFormState(false);
    });

    // 9. Initialize: This MUST run on page load
    loadProfileFromLocalStorage();
    toggleFormState(false);
});