// src/utils/validation.js

function validateResumeForm(formData) {
  const errors = {};

  if (!formData.name.trim()) errors.name = 'Name is required.';
  if (!formData.email.trim()) {
      errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format.';
  }

   if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number. Please enter a 10-digit number.';
  }

  if (!formData.summary.trim()) errors.summary = "Summary is required";

  formData.workExperience.forEach((experience, index) => {
      if (!experience.company.trim()) errors[`workExperience.${index}.company`] = 'Company name is required.';
      if (!experience.jobTitle.trim()) errors[`workExperience.${index}.jobTitle`] = 'Job title is required.';
      if (!experience.startDate) errors[`workExperience.${index}.startDate`] = 'Start date is required.';
      if (!experience.current && !experience.endDate) errors[`workExperience.${index}.endDate`] = 'End date is required.';
      if (experience.startDate && experience.endDate && !experience.current && new Date(experience.startDate) > new Date(experience.endDate)) {
          errors[`workExperience.${index}.endDate`] = 'End date must be after start date.';
      }
       if (!experience.responsibilities.trim()) errors[`workExperience.${index}.responsibilities`] = "Responsibilities are required";
  });

  formData.education.forEach((education, index) => {
      if (!education.institution.trim()) errors[`education.${index}.institution`] = 'Institution name is required.';
      if (!education.degree.trim()) errors[`education.${index}.degree`] = "Degree is Required";
      if (!education.startDate) errors[`education.${index}.startDate`] = 'Start date is required.';
      if (!education.current && !education.endDate) errors[`education.${index}.endDate`] = 'End date is required.';
       if (education.startDate && education.endDate && !education.current && new Date(education.startDate) > new Date(education.endDate)) {
          errors[`education.${index}.endDate`] = 'End date must be after start date.';
      }
  });

  return errors;
}

function validateField(field, value, formData) {
switch (field) {
  case 'name':
    return !value.trim() ? 'Name is required.' : '';
  case 'email':
    if (!value.trim()) {
      return 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format.';
    }
    return '';
  case 'phone':
     if (value && !/^\d{10}$/.test(value)) {
        return 'Invalid phone number. Please enter a 10-digit number.';
     }
     return '';
  case 'summary':
    return !value.trim() ? 'Summary is required.' : '';
  default: {
      // Handle nested fields
      const fieldParts = field.split('.');
      if (fieldParts.length > 1) {
          const section = fieldParts[0];
          const index = parseInt(fieldParts[1]);
          const subField = fieldParts[2];

          if (section === 'workExperience') {
            switch (subField) {
              case 'company': return !value.trim() ? 'Company is required' : '';
              case 'jobTitle': return !value.trim() ? 'Job Title is required' : '';
              case 'startDate': return !value ? 'Start Date is required' : '';
              case 'endDate': {
                if (!formData.workExperience[index].current && !value) {
                    return 'End Date is required';
                }
                if (formData.workExperience[index].startDate && value && new Date(formData.workExperience[index].startDate) > new Date(value)) {
                    return 'End Date cannot be before Start Date';
                }
                return '';
              }
              case 'responsibilities': return !value.trim() ? "Responsibilities are required" : '';

            }
          }
          if(section === "education"){
            switch(subField){
              case 'institution' : return !value.trim() ? "Institution is required" : '';
              case 'degree' : return !value.trim() ? 'Degree is required' : '';
              case 'startDate' : return !value ? 'Start Date is required' : '';
              case 'endDate' : {
                if(!formData.education[index].current && !value){
                  return 'End Date is required';
                }
                 if (formData.education[index].startDate && value && new Date(formData.education[index].startDate) > new Date(value)) {
                    return 'End Date cannot be before Start Date';
                }
                return '';
              }
            }
          }
      }
    return ''; // No specific validation for other fields
  }

}
}
export { validateResumeForm, validateField };