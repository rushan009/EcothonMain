export function toRegisterPayload(form) {
  return {
    name: form.name?.trim(),
    email: form.email?.trim(),
    phone: form.phone?.trim(),
    password: form.password,
    role: form.role,
  };
}

export function isSignupFormComplete(form) {
  return Boolean(form.name && form.phone && form.password && form.role);
}
