<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">Resume Information</h2>
    <p class="text-muted mb-4">Fill in the details below to generate your resume.</p>

    <form @submit.prevent="handleSubmit" class="mb-3">
      <!-- Personal Information -->
      <div class="row g-4">
        <div class="col-md-6">
          <label for="name" class="form-label">Full Name <span class="text-danger">*</span></label>
          <input type="text" id="name" v-model="formData.name" required class="form-control" @input="validateField('name')">
          <p v-if="errors.name" class="text-danger mt-1 small">{{ errors.name }}</p>
        </div>

        <div class="col-md-6">
          <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
          <input type="email" id="email" v-model="formData.email" required class="form-control" @input="validateField('email')">
          <p v-if="errors.email" class="text-danger mt-1 small">{{ errors.email }}</p>
        </div>

        <div class="col-md-6">
          <label for="phone" class="form-label">Phone Number</label>
          <input type="tel" id="phone" v-model="formData.phone" class="form-control" @input="validateField('phone')">
           <p v-if="errors.phone" class="text-danger mt-1 small">{{ errors.phone }}</p>
        </div>

        <div class="col-md-6">
          <label for="linkedin" class="form-label">LinkedIn Profile (URL)</label>
          <input type="url" id="linkedin" v-model="formData.linkedin" class="form-control">
        </div>

        <div class="col-md-6">
          <label for="github" class="form-label">GitHub Profile (URL)</label>
          <input type="url" id="github" v-model="formData.github" class="form-control">
        </div>
        <div class="col-md-6">
          <label for="portfolio" class="form-label">Portfolio Website (URL)</label>
          <input type="url" id="portfolio" v-model="formData.portfolio" class="form-control">
        </div>
      </div>

      <div class="mb-3">
        <label for="summary" class="form-label">Summary <span class="text-danger">*</span></label>
        <textarea id="summary" v-model="formData.summary" required rows="4" class="form-control" @input="validateField('summary')"></textarea>
        <p v-if="errors.summary" class="text-danger mt-1 small">{{ errors.summary }}</p>
      </div>

     <!-- Work Experience -->
      <div class="border-top pt-4">
        <h3 class="text-lg font-weight-bold mb-3">Work Experience</h3>
        <div v-for="(experience, index) in formData.workExperience" :key="index" class="mb-4 pb-4 border-bottom">

          <div class="row g-4">
            <div class="col-md-6">
              <label :for="`company-${index}`" class="form-label">Company Name <span class="text-danger">*</span></label>
              <input type="text" :id="`company-${index}`" v-model="experience.company" required class="form-control" @input="validateField(`workExperience.${index}.company`)">
              <p v-if="errors[`workExperience.${index}.company`]" class="text-danger mt-1 small">{{ errors[`workExperience.${index}.company`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`jobTitle-${index}`" class="form-label">Job Title <span class="text-danger">*</span></label>
              <input type="text" :id="`jobTitle-${index}`" v-model="experience.jobTitle" required class="form-control" @input="validateField(`workExperience.${index}.jobTitle`)">
              <p v-if="errors[`workExperience.${index}.jobTitle`]" class="text-danger mt-1 small">{{ errors[`workExperience.${index}.jobTitle`] }}</p>
            </div>

          </div>
          <div class="row g-4 mt-2">
            <div class="col-md-6">
              <label :for="`startDate-${index}`" class="form-label">Start Date <span class="text-danger">*</span></label>
              <input type="date" :id="`startDate-${index}`" v-model="experience.startDate" required class="form-control" @input="validateField(`workExperience.${index}.startDate`)">
              <p v-if="errors[`workExperience.${index}.startDate`]" class="text-danger mt-1 small">{{ errors[`workExperience.${index}.startDate`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`endDate-${index}`" class="form-label">End Date</label>
              <input type="date" :id="`endDate-${index}`" v-model="experience.endDate" :required="!experience.current"
                class="form-control" @input="validateField(`workExperience.${index}.endDate`)">
              <p v-if="errors[`workExperience.${index}.endDate`]" class="text-danger mt-1 small">{{ errors[`workExperience.${index}.endDate`] }}</p>

              <div class="form-check mt-1">
                <input type="checkbox" :id="`current-${index}`" v-model="experience.current" class="form-check-input">
                <label :for="`current-${index}`" class="form-check-label">I currently work here</label>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label :for="`responsibilities-${index}`" class="form-label">Responsibilities <span
                class="text-danger">*</span></label>
            <textarea :id="`responsibilities-${index}`" v-model="experience.responsibilities" required rows="3"
              class="form-control" @input="validateField(`workExperience.${index}.responsibilities`)"></textarea>
            <p v-if="errors[`workExperience.${index}.responsibilities`]" class="text-danger mt-1 small">
              {{ errors[`workExperience.${index}.responsibilities`] }}</p>
          </div>
          <button type="button" @click="removeExperience(index)" class="btn btn-outline-danger">Remove Experience</button>
        </div>
        <button type="button" @click="addExperience" class="btn btn-outline-primary">Add Experience</button>
      </div>
      <!-- Education -->
      <div class="border-top pt-4">
        <h3 class="text-lg font-weight-bold mb-3">Education</h3>
        <div v-for="(education, index) in formData.education" :key="index" class="mb-4 pb-4 border-bottom">
          <div class="row g-4">
            <div class="col-md-6">
              <label :for="`institution-${index}`" class="form-label">Institution Name <span
                  class="text-danger">*</span></label>
              <input :id="`institution-${index}`" type="text" v-model="education.institution" required
                class="form-control" @input="validateField(`education.${index}.institution`)">
              <p v-if="errors[`education.${index}.institution`]" class="text-danger mt-1 small">
                {{ errors[`education.${index}.institution`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`degree-${index}`" class="form-label">Degree <span class="text-danger">*</span></label>
              <input :id="`degree-${index}`" type="text" v-model="education.degree" required class="form-control" @input="validateField(`education.${index}.degree`)">
              <p v-if="errors[`education.${index}.degree`]" class="text-danger mt-1 small">{{ errors[`education.${index}.degree`] }}</p>
            </div>
          </div>
          <div class="row g-4 mt-2">
            <div class="col-md-6">
              <label :for="`eduStartDate-${index}`" class="form-label">Start Date <span
                  class="text-danger">*</span></label>
              <input :id="`eduStartDate-${index}`" type="date" v-model="education.startDate" required
                class="form-control" @input="validateField(`education.${index}.startDate`)">
              <p v-if="errors[`education.${index}.startDate`]" class="text-danger mt-1 small">
                {{ errors[`education.${index}.startDate`] }}
              </p>  <!-- Corrected: Added closing </p> tag here -->
            </div>
            <div class="col-md-6">
              <label :for="`eduEndDate-${index}`" class="form-label">End Date</label>
              <input :id="`eduEndDate-${index}`" type="date" v-model="education.endDate" class="form-control" @input="validateField(`education.${index}.endDate`)">
              <p v-if="errors[`education.${index}.endDate`]" class="text-danger mt-1 small">{{ errors[`education.${index}.endDate`] }}
              </p>
              <div class="form-check mt-1">
                <input type="checkbox" :id="`eduCurrent-${index}`" v-model="education.current" class="form-check-input">
                <label :for="`eduCurrent-${index}`" class="form-check-label">I currently study here</label>
              </div>
            </div>
          </div>  <!-- Corrected: Added closing </div> tag here -->

          <div class="row g-4 mt-2">
            <div class="col-md-6">
              <label :for="`eduMajor-${index}`" class="form-label">Major</label>
              <input :id="`eduMajor-${index}`" type="text" v-model="education.major" class="form-control">
            </div>
            <div class="col-md-6">
              <label :for="`eduMinor-${index}`" class="form-label">Minor</label>
              <input :id="`eduMinor-${index}`" type="text" v-model="education.minor" class="form-control">
            </div>
          </div>
          <button type="button" @click="removeEducation(index)" class="btn btn-outline-danger">Remove Education</button>
        </div>
        <button type="button" @click="addEducation" class="btn btn-outline-primary">Add Education</button>
      </div>
      <!-- Skills -->
      <div class="border-top pt-4">
        <h3 class="text-lg font-weight-bold mb-3">Skills</h3>
        <div class="mb-3">
          <input type="text" v-model="newSkill" @keyup.enter="addSkill" placeholder="Add a skill (press Enter)"
            class="form-control">
        </div>
        <div class="mb-3">
          <span v-for="(skill, index) in formData.skills" :key="index" class="badge bg-secondary me-2">
            {{ skill }}
            <button type="button" @click="removeSkill(index)" class="btn-close" aria-label="Remove skill"></button>
          </span>
        </div>
      </div>

      <div class="mt-3">
        <button type="submit" class="btn btn-primary w-100">
          Generate Resume
        </button>
        <p class="text-center text-muted mt-2">
          Fields marked with <span class="text-danger">*</span> are required.
        </p>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';
import { validateResumeForm, validateField as validateSingleField } from '@/utils/validation';


export default {
  name: 'ResumeForm',
  props: {
    selectedTemplate: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const formData = reactive({
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
    });

    const newSkill = ref('');
    const errors = reactive({});

    const addExperience = () => {
      formData.workExperience.push({
        company: '',
        jobTitle: '',
        startDate: '',
        endDate: '',
        current: false,
        responsibilities: '',
      });
    };

    const removeExperience = (index) => {
      formData.workExperience.splice(index, 1);
      // Clear related errors
      clearNestedErrors(`workExperience.${index}`);
    };

    const addEducation = () => {
      formData.education.push({
        institution: '',
        degree: '',
        startDate: '',
        endDate: '',
        current: false,
        major: '',
        minor: ''
      });
    };

    const removeEducation = (index) => {
      formData.education.splice(index, 1);
       // Clear related errors
      clearNestedErrors(`education.${index}`);
    };

    const addSkill = () => {
      if (newSkill.value.trim() !== '') {
        formData.skills.push(newSkill.value.trim());
        newSkill.value = '';
      }
    };

    const removeSkill = (index) => {
      formData.skills.splice(index, 1);
    };

      const clearNestedErrors = (prefix) => {
        Object.keys(errors)
          .filter(key => key.startsWith(prefix))
          .forEach(key => delete errors[key]);
    };

    const validateForm = () => {
      Object.keys(errors).forEach(key => delete errors[key]); // Clear previous errors.
      const validationErrors = validateResumeForm(formData);
      Object.assign(errors, validationErrors); // Update the errors object.
      return Object.keys(errors).length === 0; // Return true if no errors.
    };

      const validateField = (field) => {
        const fieldParts = field.split('.');
        let fieldValue = formData;
        for (const part of fieldParts) {
          if (!isNaN(parseInt(part))) { // Check if part is a number (array index)
            fieldValue = fieldValue[parseInt(part)];
          } else {
            fieldValue = fieldValue[part];
          }

          if (fieldValue === undefined) break; // Handle cases where the nested property doesn't exist
        }

        const validationError = validateSingleField(field, fieldValue, formData);
        if (validationError) {
          errors[field] = validationError;
        } else {
          delete errors[field];  //Remove Error
        }
    };

    const handleSubmit = () => {
      if (validateForm()) {
        emit('generate-resume', {
          formData: formData,
          selectedTemplate: props.selectedTemplate,
        });
      }
    };

    return {
      formData,
      newSkill,
      errors,
      addExperience,
      removeExperience,
      addEducation,
      removeEducation,
      addSkill,
      removeSkill,
      handleSubmit,
      validateField,
    };
  },
};
</script>
