<template>
  <div class="p-4 border rounded shadow-sm">
    <h2 class="text-xl font-weight-bold mb-4">Resume Preview</h2>
    <div v-html="sanitizedResumeHtml" class="resume-preview"></div>
  </div>
</template>

<script>
import DOMPurify from 'dompurify';
import { ref, watch, onMounted } from 'vue';

export default {
  name: 'ResumePreview',
  props: {
    resumeHtml: {
      type: String,
      default: '',
    },
    resumeData: { // Add a new prop for the resume data
      type: Object,
      required: true
    }
  },
    setup(props) {
    const sanitizedResumeHtml = ref('');

      const injectData = () => {
          if (!props.resumeHtml || !props.resumeData) {
            sanitizedResumeHtml.value = ''; // Clear if data is missing
            return;
          }
        let html = props.resumeHtml;
        const data = props.resumeData;

          // Helper function to create a span with a data attribute
        const createDataSpan = (value, dataKey) => {
          return `<span data-key="${dataKey}">${value}</span>`;
        };


        html = html.replace(/\[NAME_PLACEHOLDER\]/g, createDataSpan(data.name, 'name'));
        html = html.replace(/\[EMAIL_PLACEHOLDER\]/g, createDataSpan(data.email, 'email'));
        html = html.replace(/\[PHONE_PLACEHOLDER\]/g, createDataSpan(data.phone, 'phone'));
        html = html.replace(/\[LINKEDIN_PLACEHOLDER\]/g, data.linkedin ? `<a href="${data.linkedin}" target="_blank" data-key="linkedin">${data.linkedin}</a>` : '');
        html = html.replace(/\[GITHUB_PLACEHOLDER\]/g, data.github ? `<a href="${data.github}" target="_blank" data-key="github">${data.github}</a>` : '');
        html = html.replace(/\[PORTFOLIO_PLACEHOLDER\]/g, data.portfolio ? `<a href="${data.portfolio}" target="_blank" data-key="portfolio">${data.portfolio}</a>` : '');
        html = html.replace(/\[SUMMARY_PLACEHOLDER\]/g, createDataSpan(data.summary, 'summary'));

       // Work Experience
        const workExpRegex = /\[WORK_EXPERIENCE_PLACEHOLDER\]/g;
        let workExpHtml = '';
        data.workExperience.forEach((exp, index) => {
            workExpHtml += `<div data-key="workExperience.${index}">`;
            workExpHtml += `<p><strong>Company:</strong> ${createDataSpan(exp.company, `workExperience.${index}.company`)}</p>`;
            workExpHtml += `<p><strong>Job Title:</strong> ${createDataSpan(exp.jobTitle, `workExperience.${index}.jobTitle`)}</p>`;
            workExpHtml += `<p><strong>Dates:</strong> ${createDataSpan(exp.startDate, `workExperience.${index}.startDate`)} - ${exp.current ? 'Present' : createDataSpan(exp.endDate, `workExperience.${index}.endDate`)}</p>`;
            workExpHtml += `<p><strong>Responsibilities:</strong></p><ul>`;
            exp.responsibilities.split('\n').forEach(line => {
            workExpHtml += `<li>${createDataSpan(line, `workExperience.${index}.responsibilities`)}</li>`;
          });
            workExpHtml += `</ul></div>`;
        });
        html = html.replace(workExpRegex, workExpHtml);

        // Education
        const educationRegex = /\[EDUCATION_PLACEHOLDER\]/g;
        let educationHtml = '';
        data.education.forEach((edu, index) => {
          educationHtml += `<div data-key="education.${index}">`;
          educationHtml += `<p><strong>Institution:</strong> ${createDataSpan(edu.institution,`education.${index}.institution`)}</p>`;
          educationHtml += `<p><strong>Degree:</strong> ${createDataSpan(edu.degree, `education.${index}.degree`)}</p>`;
          if (edu.major) educationHtml += `<p><strong>Major:</strong> ${createDataSpan(edu.major, `education.${index}.major`)}</p>`;
          if (edu.minor) educationHtml += `<p><strong>Minor:</strong> ${createDataSpan(edu.minor,`education.${index}.minor`)}</p>`;
          educationHtml += `<p><strong>Dates:</strong> ${createDataSpan(edu.startDate,`education.${index}.startDate`)} - ${edu.current ? 'Present' : createDataSpan(edu.endDate, `education.${index}.endDate`)}</p>`;
          educationHtml += `</div>`;
        });
        html = html.replace(educationRegex, educationHtml);

        // Skills
        const skillsRegex = /\[SKILLS_PLACEHOLDER\]/g;
        let skillsHtml = data.skills.map(skill => createDataSpan(skill, 'skills')).join(', ');
        html = html.replace(skillsRegex, skillsHtml);

        sanitizedResumeHtml.value = DOMPurify.sanitize(html);
      };
       // Watch for changes in both resumeHtml and resumeData
    watch([() => props.resumeHtml, () => props.resumeData], injectData, { immediate: true });

    return { sanitizedResumeHtml };
  },
};
</script>

<style scoped>
.resume-preview {
  font-family: sans-serif;
}
</style>
