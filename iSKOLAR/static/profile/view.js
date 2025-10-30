document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // --- Form Edit/Save/Cancel Logic Elements ---
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const formActions = document.getElementById('formActions');
    const profileForm = document.getElementById('profileForm');
    const inputs = profileForm.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea');
    const radios = profileForm.querySelectorAll('input[type="radio"]');

    // --- Sidebar Display Elements ---
    const displayName = document.getElementById('displayName');
    const displayMajor = document.getElementById('displayMajor');
    const displayEmail = document.getElementById('displayEmail');
    const displayPhone = document.getElementById('displayPhone');
    const displayLocation = document.getElementById('displayLocation');
    const displayGraduation = document.getElementById('displayGraduation');

    // --- Educational Background Elements ---
    const yearLevel = document.getElementById('yearLevel');
    const currentSchool = document.getElementById('currentSchool');
    const course = document.getElementById('course');
    const gwa = document.getElementById('gwa');
    const courseLabel = document.querySelector('label[for="course"]');
    const gwaLabel = document.querySelector('label[for="gwa"]');
    const eduBtns = document.querySelectorAll('.edu-btn');

    // --- Completeness Elements ---
    const completenessBar = document.getElementById('completenessBar');
    const completenessPercent = document.getElementById('completenessPercent');
    const missingInfoList = document.querySelector('.missing-info ul');

    // --- Avatar Upload Elements ---
    const profileAvatar = document.getElementById('profileAvatar');
    const avatarInput = document.getElementById('avatarInput');
    const avatarEditIcon = document.getElementById('avatarEditIcon');

    // --- State Storage ---
    const originalValues = {};

    const COMPLETENESS_FIELDS = [
        { id: 'firstName', name: 'First Name' },
        { id: 'lastName', name: 'Last Name' },
        { id: 'address', name: 'Address' },
        { id: 'birthdate', name: 'Birthdate' },
        { id: 'citizenship', name: 'Citizenship' },
        { id: 'gender', name: 'Gender' },
        { id: 'email', name: 'Email Address' },
        { id: 'phone', name: 'Phone Number' },
        { id: 'currentSchool', name: 'Current School' },
        { id: 'yearLevel', name: 'Year Level' },
        { id: 'course', name: 'College Course' },
        { id: 'gwa', name: 'GPA/GWA' },
        { id: 'bio', name: 'Complete Bio', minLength: 20 },
    ];
    const TOTAL_FIELDS = COMPLETENESS_FIELDS.length + 1;

    // --- Helper Functions ---
    const storeOriginalValues = () => {
        inputs.forEach(input => { originalValues[input.id] = input.value; });
        radios.forEach(radio => { if (radio.checked) originalValues[radio.name] = radio.id; });

        originalValues['displayName'] = displayName.textContent;
        originalValues['displayMajor'] = displayMajor.textContent;
        originalValues['displayEmail'] = displayEmail.textContent;
        originalValues['displayPhone'] = displayPhone.textContent;
        originalValues['displayLocation'] = displayLocation.textContent;
        originalValues['displayGraduation'] = displayGraduation.textContent;

        originalValues['avatarBackground'] = profileAvatar.style.backgroundImage;
        originalValues['avatarContent'] = profileAvatar.innerHTML;
    };

    const disableForm = (disabled) => {
        inputs.forEach(input => input.disabled = disabled);
        radios.forEach(radio => radio.disabled = disabled);
        yearLevel.disabled = disabled;
    };

    const toggleFormState = (isEditing) => {
        disableForm(!isEditing);
        formActions.style.display = isEditing ? 'flex' : 'none';
        editBtn.style.display = isEditing ? 'none' : 'flex';
    };

    const updateCompleteness = (hasAvatar) => {
        let completedCount = hasAvatar ? 1 : 0;
        let missingItems = [];

        if (!hasAvatar) missingItems.push("Upload Profile Photo");

        COMPLETENESS_FIELDS.forEach(field => {
            let isComplete = false;
            const element = document.getElementById(field.id);

            if (element) {
                if (element.tagName === 'TEXTAREA' && field.minLength) isComplete = element.value.trim().length >= field.minLength;
                else isComplete = element.value.trim() !== '';
            } else if (field.id === 'citizenship' || field.id === 'gender') {
                isComplete = !!document.querySelector(`input[name="${field.id}"]:checked`);
            }

            if (isComplete) completedCount++;
            else {
                let missingName = field.name;
                if (field.id === 'gwa') missingName = 'Add GPA/GWA';
                if (field.id === 'bio') missingName = 'Complete Bio (min 20 chars)';
                missingItems.push(missingName);
            }
        });

        const percentage = Math.round((completedCount / TOTAL_FIELDS) * 100);
        completenessBar.style.width = `${percentage}%`;
        completenessPercent.textContent = `${percentage}%`;

        missingInfoList.innerHTML = '';
        missingItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            missingInfoList.appendChild(li);
        });
    };

    // --- Avatar Upload ---
    avatarEditIcon.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            profileAvatar.style.backgroundImage = `url(${ev.target.result})`;
            profileAvatar.innerHTML = '';
            updateCompleteness(true);
        };
        reader.readAsDataURL(file);
    });

    // --- Edit / Cancel / Save ---
    let isEditing = false;

    editBtn.addEventListener('click', () => { isEditing = true; storeOriginalValues(); toggleFormState(true); });
    cancelBtn.addEventListener('click', () => {
        isEditing = false;
        inputs.forEach(input => { input.value = originalValues[input.id]; });
        radios.forEach(radio => { radio.checked = radio.id === originalValues[radio.name]; });
        displayName.textContent = originalValues['displayName'];
        displayMajor.textContent = originalValues['displayMajor'];
        displayEmail.textContent = originalValues['displayEmail'];
        displayPhone.textContent = originalValues['displayPhone'];
        displayLocation.textContent = originalValues['displayLocation'];
        displayGraduation.textContent = originalValues['displayGraduation'];
        profileAvatar.style.backgroundImage = originalValues['avatarBackground'];
        profileAvatar.innerHTML = originalValues['avatarContent'];
        updateCompleteness(originalValues['avatarBackground'] !== '');
        toggleFormState(false);
    });

    saveBtn.addEventListener('click', () => {
        isEditing = false;
        if (!document.getElementById('firstName').value || !document.getElementById('lastName').value) {
            alert('First Name and Last Name are required.');
            return;
        }
        const graduationYearText = yearLevel.options[yearLevel.selectedIndex].text;
        const graduationYear = graduationYearText.match(/\d{4}/)?.[0] || 'N/A';

        displayName.textContent = `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`;
        displayMajor.textContent = course.value || 'N/A';
        displayEmail.textContent = document.getElementById('email').value;
        displayPhone.textContent = document.getElementById('phone').value;
        displayLocation.textContent = document.getElementById('address').value;
        displayGraduation.textContent = `Class of ${graduationYear}`;

        updateCompleteness(profileAvatar.style.backgroundImage !== '');
        toggleFormState(false);
        storeOriginalValues();
    });

    // --- Educational Background Dynamic Logic ---
// --- Educational Background Dynamic Logic ---
function setYearLevels(level) {
    // Check if the yearLevel element exists before proceeding
    if (!yearLevel) return;

    // Clear existing options
    yearLevel.innerHTML = '';
    // Enable the dropdown when a level is selected
    yearLevel.disabled = false; 

    // Reset values to clear previous selection
    yearLevel.value = "";
    course.value = "";
    gwa.value = "";

    // Add a default "Select Grade/Year" option
    const defaultOption = document.createElement('option');
    defaultOption.textContent = `Select ${level === 'COLLEGE' ? 'Year' : 'Grade'}`;
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    yearLevel.appendChild(defaultOption);


    if (level === "JUNIOR HIGH") {
        courseLabel.style.display = "none";
        course.style.display = "none";
        gwaLabel.textContent = "General Average";
        currentSchool.placeholder = "e.g., Example National High School";

        // JUNIOR HIGH: Grades 7 to 10
        ["Grade 7","Grade 8","Grade 9","Grade 10"].forEach(g => {
            const o = document.createElement('option');
            o.textContent = g;
            o.value = g; // Use the grade as the value
            yearLevel.appendChild(o);
        });
    } else if (level === "SENIOR HIGH") {
        courseLabel.style.display = "block";
        course.style.display = "block";
        courseLabel.textContent = "Academic Track / Strand";
        gwaLabel.textContent = "Average Grade";
        currentSchool.placeholder = "e.g., Example Senior High School";

        // SENIOR HIGH: Grades 11 to 12
        ["Grade 11","Grade 12"].forEach(g => {
            const o = document.createElement('option');
            o.textContent = g;
            o.value = g; // Use the grade as the value
            yearLevel.appendChild(o);
        });
    } else if (level === "COLLEGE") {
        courseLabel.style.display = "block";
        course.style.display = "block";
        courseLabel.textContent = "College Course / Major";
        gwaLabel.textContent = "GPA / GWA";
        currentSchool.placeholder = "e.g., Example University";

        // COLLEGE: 1st Year to 5th Year
        // Note: I'm removing the (YYYY) graduation year from the text and value here,
        // as you have it calculated in the saveBtn logic based on text content.
        ["1st Year","2nd Year","3rd Year","4th Year","5th Year"].forEach(y => {
            const o = document.createElement('option');
            o.textContent = y;
            o.value = y;
            yearLevel.appendChild(o);
        });
    }
}

// Remove the 'isEditing' check so buttons always work
eduBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Only allow selection if the form is currently being edited
        // You might want to re-add this logic if the buttons shouldn't work when disabled:
        // if (!isEditing) return; 
        
        eduBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setYearLevels(btn.textContent.trim());
    });
});




    // --- Phone Number Logic ---
    const countrySelect = document.getElementById('countrySelect');
    const phoneInput = document.getElementById('phone');
    countrySelect.addEventListener('change', () => phoneInput.value = countrySelect.value + ' ');
    phoneInput.addEventListener('input', () => { if (!phoneInput.value.startsWith(countrySelect.value)) phoneInput.value = countrySelect.value + ' '; });

    // --- Birthdate Logic ---
    const birthdateInput = document.getElementById('birthdate');
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0];
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    birthdateInput.setAttribute('max', maxDate);
    birthdateInput.setAttribute('min', minDate);

    // --- Initial Setup ---
    updateCompleteness(profileAvatar.style.backgroundImage !== '');
    storeOriginalValues();
});
