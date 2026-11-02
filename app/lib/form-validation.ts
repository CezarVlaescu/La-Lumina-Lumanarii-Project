import type { FormEvent } from "react";

type ValidatableField =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

function getField(event: FormEvent<HTMLFormElement>) {
  const target = event.target;
  return target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
    ? (target as ValidatableField)
    : null;
}

function setFieldValidationMessage(field: ValidatableField) {
  field.setCustomValidity("");
  if (field.validity.valueMissing) {
    field.setCustomValidity(
      field instanceof HTMLInputElement && field.type === "checkbox"
        ? "Bifează această opțiune pentru a continua."
        : "Completează acest câmp.",
    );
  } else if (field.validity.typeMismatch) {
    field.setCustomValidity("Introdu o adresă de email validă.");
  } else if (field.validity.tooShort) {
    const minimumLength =
      field instanceof HTMLSelectElement ? 0 : field.minLength;
    field.setCustomValidity(
      `Introdu minimum ${minimumLength} caractere.`,
    );
  } else if (field.validity.patternMismatch) {
    field.setCustomValidity(field.title || "Valoarea introdusă nu este validă.");
  }
}

export function setRomanianValidationMessage(
  event: FormEvent<HTMLFormElement>,
) {
  const field = getField(event);
  if (!field) return;
  setFieldValidationMessage(field);
}

export function clearValidationMessage(event: FormEvent<HTMLFormElement>) {
  getField(event)?.setCustomValidity("");
}

export function validateFormInRomanian(form: HTMLFormElement) {
  const fields = (Array.from(form.elements) as unknown[]).filter(
    (element): element is ValidatableField =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) &&
      element.willValidate,
  );

  for (const field of fields) field.setCustomValidity("");
  const firstInvalid = fields.find((field) => !field.validity.valid);
  if (!firstInvalid) return true;

  setFieldValidationMessage(firstInvalid);
  firstInvalid.reportValidity();
  return false;
}
