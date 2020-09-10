import { UsernamePasswordInput } from '../resolvers/UsernamePasswordInput';

export const validateRegister = (options: UsernamePasswordInput) => {
  let errors;
  if (options.email.length <= 3 || !options.email.includes("@")) {
    errors = [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  } else if (options.username.length <= 2) {
    errors = [
      {
        field: "username",
        message: "length must be greater than 2",
      },
    ];
  } else if (options.password.length <= 2) {
    errors = [
      {
        field: "password",
        message: "length must be greater than 2",
      },
    ];
  } else if (options.username.includes("@")) {
    errors = [
      {
        field: "username",
        message: "cannot include an @",
      },
    ];
  } else {
    errors = null;
  }

  return errors;
};
