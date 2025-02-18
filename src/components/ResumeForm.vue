// /src/components/ResumeForm.vue
<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">Resume Information</h2>
    <p class="text-muted mb-4">Fill in the details below to generate your resume.</p>

    <form @submit.prevent="handleSubmit" class="mb-3">
      <div class="row g-4">
        <div class="col-md-6">
          <label for="name" class="form-label">Full Name <span class="text-danger">*</span></label>
          <input type="text" id="name" v-model="formData.name" required class="form-control">
          <p v-if="errors.name" class="text-danger mt-1 small">{{ errors.name }}</p>
        </div>

        <div class="col-md-6">
          <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
          <input type="email" id="email" v-model="formData.email" required class="form-control">
          <p v-if="errors.email" class="text-danger mt-1 small">{{ errors.email }}</p>
        </div>

        <div class="col-md-6">
          <label for="phone" class="form-label">Phone Number</label>
          <input type="tel" id="phone" v-model="formData.phone" class="form-control">
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
        <textarea id="summary" v-model="formData.summary" required rows="4" class="form-control"></textarea>
        <p v-if="errors.summary" class="text-danger mt-1 small">{{ errors.summary }}</p>
      </div>

      <div class="border-top pt-4">
        <h3 class="text-lg font-weight-bold mb-3">Work Experience</h3>
        <div v-for="(experience, index) in formData.workExperience" :key="index" class="mb-4 pb-4 border-bottom">

          <div class="row g-4">
            <div class="col-md-6">
              <label :for="`company-${index}`" class="form-label">Company Name <span class="text-danger">*</span></label>
              <input type="text" :id="`company-${index}`" v-model="experience.company" required class="form-control">
              <p v-if="errors[`company-${index}`]" class="text-danger mt-1 small">{{ errors[`company-${index}`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`jobTitle-${index}`" class="form-label">Job Title <span class="text-danger">*</span></label>
              <input type="text" :id="`jobTitle-${index}`" v-model="experience.jobTitle" required class="form-control">
              <p v-if="errors[`jobTitle-${index}`]" class="text-danger mt-1 small">{{ errors[`jobTitle-${index}`] }}</p>
            </div>

          </div>
          <div class="row g-4 mt-2">
            <div class="col-md-6">
              <label :for="`startDate-${index}`" class="form-label">Start Date <span class="text-danger">*</span></label>
              <input type="date" :id="`startDate-${index}`" v-model="experience.startDate" required class="form-control">
              <p v-if="errors[`startDate-${index}`]" class="text-danger mt-1 small">{{ errors[`startDate-${index}`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`endDate-${index}`" class="form-label">End Date <span class="text-danger">*</span></label>
              <input type="date" :id="`endDate-${index}`" v-model="experience.endDate" :required="!experience.current"
                class="form-control">
              <p v-if="errors[`endDate-${index}`]" class="text-danger mt-1 small">{{ errors[`endDate-${index}`] }}</p>

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
              class="form-control"></textarea>
            <p v-if="errors[`responsibilities-${index}`]" class="text-danger mt-1 small">
              {{ errors[`responsibilities-${index}`] }}</p>
          </div>
          <button type="button" @click="removeExperience(index)" class="btn btn-outline-danger">Remove Experience</button>
        </div>
        <button type="button" @click="addExperience" class="btn btn-outline-primary">Add Experience</button>
      </div>

      <div class="border-top pt-4">
        <h3 class="text-lg font-weight-bold mb-3">Education</h3>
        <div v-for="(education, index) in formData.education" :key="index" class="mb-4 pb-4 border-bottom">
          <div class="row g-4">
            <div class="col-md-6">
              <label :for="`institution-${index}`" class="form-label">Institution Name <span
                  class="text-danger">*</span></label>
              <input :id="`institution-${index}`" type="text" v-model="education.institution" required
                class="form-control">
              <p v-if="errors[`institution-${index}`]" class="text-danger mt-1 small">
                {{ errors[`institution-${index}`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`degree-${index}`" class="form-label">Degree <span class="text-danger">*</span></label>
              <input :id="`degree-${index}`" type="text" v-model="education.degree" required class="form-control">
              <p v-if="errors[`degree-${index}`]" class="text-danger mt-1 small">{{ errors[`degree-${index}`] }}</p>
            </div>
          </div>
          <div class="row g-4 mt-2">
            <div class="col-md-6">
              <label :for="`eduStartDate-${index}`" class="form-label">Start Date <span
                  class="text-danger">*</span></label>
              <input :id="`eduStartDate-${index}`" type="date" v-model="education.startDate" required
                class="form-control">
              <p v-if="errors[`eduStartDate-${index}`]" class="text-danger mt-1 small">
                {{ errors[`eduStartDate-${index}`] }}</p>
            </div>
            <div class="col-md-6">
              <label :for="`eduEndDate-${index}`" class="form-label">End Date</label>
              <input :id="`eduEndDate-${index}`" type="date" v-model="education.endDate" class="form-control">
              <p v-if="errors[`eduEndDate-${index}`]" class="text-danger mt-1 small">{{ errors[`eduEndDate-${index}`] }}
              </p>
              <div class="form-check mt-1">
                <input type="checkbox" :id="`eduCurrent-${index}`" v-model="education.current" class="form-check-input">
                <label :for="`eduCurrent-${index}`" class="form-check-label">I currently study here</label>
              </div>
            </div>

          </div>
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
export default {
  name: 'ResumeForm',
  props: {
    selectedTemplate: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      formData: {
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
      },
      newSkill: '',
      errors: {}, // Store validation errors
    };
  },
  methods: {
    addExperience() {
      this.formData.workExperience.push({
        company: '',
        jobTitle: '',
        startDate: '',
        endDate: '',
        current: false,
        responsibilities: '',
      });
    },
    removeExperience(index) {
      this.formData.workExperience.splice(index, 1);
      // Clear related errors when removing an experience
      Object.keys(this.errors).forEach(key => {
        if (key.startsWith(`company-${index}`) || key.startsWith(`jobTitle-${index}`) ||
            key.startsWith(`startDate-${index}`) || key.startsWith(`endDate-${index}`) ||
            key.startsWith(`responsibilities-${index}`)) {
          delete this.errors[key];
        }
      });
    },
    addEducation() {
      this.formData.education.push({
        institution: '',
        degree: '',
        startDate: '',
        endDate: '',
        current: false,
        major: '',
        minor: ''
      });
    },
    removeEducation(index) {
      this.formData.education.splice(index, 1);
      // Clear related errors
      Object.keys(this.errors).forEach(key => {
        if (key.startsWith(`institution-${index}`) || key.startsWith(`degree-${index}`) ||
            key.startsWith(`eduStartDate-${index}`) || key.startsWith(`eduEndDate-${index}`)) {
          delete this.errors[key];
        }
      });
    },
    addSkill() {
      if (this.newSkill.trim() !== '') {
        this.formData.skills.push(this.newSkill.trim());
        this.newSkill = '';
      }
    },
    removeSkill(index) {
      this.formData.skills.splice(index, 1);
    },
    validateForm() {
      this.errors = {}; // Reset errors
      let isValid = true;

      if (!this.formData.name.trim()) {
        this.errors.name = 'Name is required.';
        isValid = false;
      }
      if (!this.formData.email.trim()) {
        this.errors.email = 'Email is required.';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        this.errors.email = 'Invalid email format.';
        isValid = false;
      }

      if (!this.formData.summary.trim()) {
        this.errors.summary = "Summary is required";
        isValid = false
      }
      // Add more validation rules as needed (e.g., phone number format)

      // Work Experience Validation
      this.formData.workExperience.forEach((experience, index) => {
        if (!experience.company.trim()) {
          this.errors[`company-${index}`] = 'Company name is required.';
          isValid = false;
        }
        if (!experience.jobTitle.trim()) {
          this.errors[`jobTitle-${index}`] = 'Job title is required.';
          isValid = false;
        }
        if (!experience.startDate) {
          this.errors[`startDate-${index}`] = 'Start date is required.';
          isValid = false;
        }
        if (!experience.current && !experience.endDate) {
          this.errors[`endDate-${index}`] = 'End date is required.';
          isValid = false;
        }
        if (experience.startDate && experience.endDate && !experience.current) {
          if (new Date(experience.startDate) > new Date(experience.endDate)) {
            this.errors[`endDate-${index}`] = 'End date must be after start date.';
            isValid = false;
          }
        }
        if (!experience.responsibilities.trim()) {
          this.errors[`responsibilities-${index}`] = "Responsibilities are required";
          isValid = false;
        }
      });

      // Education Validation
      this.formData.education.forEach((education, index) => {
        if (!education.institution.trim()) {
          this.errors[`institution-${index}`] = 'Institution name is required.';
          isValid = false;
        }
        if (!education.degree.trim()) {
          this.errors[`degree-${index}`] = "Degree is Required";
          isValid = false;
        }
        if (!education.startDate) {
          this.errors[`eduStartDate-${index}`] = 'Start date is required.';
          isValid = false;
        }
        if (!education.current && !education.endDate) {
          this.errors[`eduEndDate-${index}`] = 'End date is required.';
          isValid = false;
        }
        if (education.startDate && education.endDate && !education.current) {
          if (new Date(education.startDate) > new Date(education.endDate)) {
            this.errors[`eduEndDate-${index}`] = 'End date must be after start date.';
            isValid = false;
          }
        }
      });

      return isValid;
    },
    handleSubmit() {
      if (this.validateForm()) {
        this.$emit('generate-resume', {
          formData: this.formData,
          selectedTemplate: this.selectedTemplate,
        });
      }
    },
  },
};
</script>