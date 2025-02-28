import * as yup from 'yup';

// Validation function (if you still need it for specific cases, otherwise, use schemas directly)
function validateContentForm(formData, contentType) {
    const errors = {};

    if (contentType === 'resume') {
        if (!formData.name?.trim()) errors.name = 'Name is required.';
        if (!formData.email?.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format.';
        }
        if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            errors.phone = 'Invalid phone number.  Enter a 10-digit number.';
        }
        if (!formData.summary?.trim()) errors.summary = 'Summary is required.';

    } else if (contentType === 'poster') {
        if (!formData.title?.trim()) errors.title = 'Title is required.';
        if (!formData.body?.trim()) errors.body = 'Body text is required.';

    } else if (contentType === 'social') {
        if (!formData.platform?.trim()) errors.platform = 'Platform is required.';
        if (!formData.content?.trim()) errors.content = 'Post content is required.';
    } else if (contentType === "custom"){
        if (!formData.html?.trim()) errors.html = "HTML Content is required";
    }
    return errors;
}


// Yup Schemas for AuthForm (Centralized Validation)
const loginSchema = yup.object({
    email: yup.string().required().email(),
    password: yup.string().required(),
});

const signupSchema = yup.object({
    email: yup.string().required().email(),
    password: yup.string().required().min(6),
});

const resetSchema = yup.object({
    email: yup.string().required().email(),
});

const developerSchema = yup.object({
    apiKey: yup.string().required('API Key is required'),
});

// General field validation (optional, if needed outside of VeeValidate)
function validateField(field, value, formData) {
    if (field === "email") {
        if (!value?.trim()) {
            return 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email format.';
        }
        return '';
    }
    if (field === "phone") {
        if (value && !/^\d{10}$/.test(value)) {
            return 'Invalid phone number.  Enter a 10-digit number.';
        }
        return '';
    }

    //For Required Field
    return !value?.trim() ? `${field} is required` : '';
}

export { validateContentForm, validateField, loginSchema, signupSchema, resetSchema, developerSchema };
