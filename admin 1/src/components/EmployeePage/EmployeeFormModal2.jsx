import { ImagePlus, Lock, Save, Upload, X } from "lucide-react";
import {
  accountOptions,
  departmentOptions,
  genderOptions,
  getTodayDate,
  salaryPeriodOptions,
} from "./employeePageUtils";
import { employeeFormModalStyles as s } from "../../assets/dummyStyles";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const FieldError = ({ children }) =>
  children ? <p className={s.fieldError}>{children}</p> : null;

  const employeeSchema = z.object({
    id: z.string().trim().min(1, "Employee ID is required"),

    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .regex(/^[A-Za-z ]+$/, "Use letters and spaces only"),

    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .pipe(z.email("Enter a valid email address")),

    workEmail: z
      .string()
      .trim()
      .min(1, "Work Email is required")
      .pipe(z.email("Enter a valid work email")),

    workPassword: z
      .string()
      .min(8, "Password must contain at least 8 characters"),

    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"),

    gender: z.string().min(1, "Gender is required"),

    department: z.string().trim().min(1, "Department is required"),

    designation: z.string().trim().min(1, "Designation is required"),

    salary: z.coerce
      .number()
      .finite("Enter a valid salary")
      .positive("Salary must be greater than zero"),

    bankName: z.string().trim().min(1, "Bank Name is required"),

    accountNumber: z
      .string()
      .regex(/^[0-9]{9,18}$/, "Account number must contain 9 to 18 digits"),

    ifscCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  });

const EmployeeFormModal = ({
  mode,
  formData,
  formErrors,
  onChange,
  onClose,
  onImageChange,
  onSubmit,
  loading = false,
}) => {
  const isEditMode = mode === "edit";
  const todayDate = getTodayDate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(employeeSchema),
    mode: "onBlur",
    defaultValues: {
      id: "",
      name: "",
      email: "",
      workEmail: "",
      workPassword: "",
      phone: "",
      gender: "",
      department: "Engineering",
      designation: "",
      salary: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
    },
  });


  console.log("errors: ", errors);

  return (
    <div className={s.overlay}>
      <section className={s.container}>
        <div className={s.header}>
          <div>
            <p className={s.headerLabel}>
              {isEditMode ? "Edit Employee" : "New Employee"}
            </p>
            <h2 className={s.headerTitle}>
              {isEditMode ? "Update Employee Details" : "Add Employee Details"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={s.closeButton}
            aria-label="Close employee form"
          >
            <X className={s.closeIcon} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={s.formBody}>
          <div className={s.formGrid}>
            <div>
              <div
                className={s.getImageContainerClass(formErrors.profileImage)}
              >
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Employee profile preview"
                    className={s.previewImage}
                  />
                ) : (
                  <ImagePlus className={s.placeholderIcon} />
                )}
              </div>
              <label htmlFor="profileImage" className={s.uploadButton}>
                <Upload className={s.uploadIcon} />
                Upload Photo
              </label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className={s.fileInput}
              />
              <FieldError>{formErrors.profileImage}</FieldError>
            </div>

            <div className={s.fieldsGrid}>
              <label className={s.fieldLabel}>
                Employee ID
                <input
                  //   value={formData.id}
                  //   onChange={(event) => onChange("id", event.target.value)}

                  id="employee-id"

                  // {...register("id", {
                  //   required: "Employee ID is required",
                  // })}

                  {...register("id")}
                  className={s.getInputClass("id", errors, true)}
                  placeholder="EMP-1007"
                />
                <FieldError>{errors.id?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Full Name
                <input
                  //   value={formData.name}
                  //   onChange={(event) => onChange("name", event.target.value)}

                  id="employee-name"
                  // {...register("name", {
                  //   required: "Employee Name is required",
                  //   minLength: {
                  //     value: 2,
                  //     message: "Name must contain at least 2 characters",
                  //   },
                  //   pattern: {
                  //     value: /^[A-Za-z ]+$/,
                  //     message: "Use letters and spaces only",
                  //   },
                  // })}
                  {...register("name")}
                  className={s.getInputClass("name", errors, true)}
                  placeholder="Employee name"
                />
                <FieldError>{errors.name?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Email
                <input
                  //   value={formData.email}
                  //   onChange={(event) => onChange("email", event.target.value)}
                  // {...register("email", {
                  //   required: "Email is required",
                  //   pattern: {
                  //     value: /^\S+@\S+\.\S+$/,
                  //     message: "Enter a valid email address",
                  //   },
                  // })}
                  {...register("email")}
                  className={s.getInputClass("email", errors, true)}
                  placeholder="name@company.com"
                  type="email"
                />
                <FieldError>{errors.email?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Work Email
                <input
                  //   value={formData.workEmail}
                  //   onChange={(event) =>
                  //     onChange("workEmail", event.target.value)
                  //   }
                  // {...register("workEmail", {
                  //   required: "Work Email is required",
                  //   pattern: {
                  //     value: /^\S+@\S+\.\S+$/,
                  //     message: "Enter a valid work email",
                  //   },
                  // })}
                  {...register("workEmail")}
                  className={s.getInputClass("workEmail", errors, true)}
                  placeholder="employee@company.com"
                  type="email"
                />
                <FieldError>{errors.workEmail?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Work Password
                <input
                  //   value={formData.workPassword}
                  //   onChange={(event) =>
                  //     onChange("workPassword", event.target.value)
                  //   }
                  // {...register("workPassword", {
                  //   required: "Work Password is required",
                  //   minLength: {
                  //     value: 8,
                  //     message: "Password must contain at least 8 characters",
                  //   },
                  // })}
                  {...register("workPassword")}
                  className={s.getInputClass("workPassword", errors, true)}
                  placeholder="Temporary password"
                  type="text"
                />
                <FieldError>{errors.workPassword?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Phone Number
                <input
                  //   value={formData.phone}
                  //   onChange={(event) => onChange("phone", event.target.value)}
                  // {...register("phone", {
                  //   required: "Phone Number is required",
                  //   pattern: {
                  //     value: /^[0-9]{10}$/,
                  //     message: "Phone number must contain exactly 10 digits",
                  //   },
                  // })}
                  {...register("phone")}
                  className={s.getInputClass("phone", errors, true)}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Gender
                <select
                  //   value={formData.gender}
                  //   onChange={(event) => onChange("gender", event.target.value)}
                  // {...register("gender", {
                  //   required: "Gender is required",
                  // })}

                  {...register("gender")}

                  className={s.getSelectClass("gender", errors)}
                >
                  {genderOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.gender?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Department
                <input
                  list="departmentOptions"
                  //   value={formData.department}
                  //   onChange={(event) =>
                  //     onChange("department", event.target.value)
                  //   }

                  // {...register("department", {
                  //   required: "Department is required",
                  // })}

                  {...register("department")}
                  className={s.getInputClass("department", errors, true)}
                  placeholder="Department"
                />
                <FieldError>{errors.department?.message}</FieldError>
                <datalist id="departmentOptions">
                  {departmentOptions.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                <FieldError>{formErrors.department}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Designation
                <input
                  //   value={formData.designation}
                  //   onChange={(event) =>
                  //     onChange("designation", event.target.value)
                  //   }

                  // {...register("designation", {
                  //   required: "Designation is required",
                  // })}
                  {...register("designation")}
                  className={s.getInputClass("designation", errors, true)}
                  placeholder="Job role"
                />
                <FieldError>{errors.designation?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Salary
                <input
                  //   value={formData.salary}
                  //   onChange={(event) => onChange("salary", event.target.value)}
                  // {...register("salary", { required: "salary is required" })}
                  {...register("salary")}
                  className={s.getInputClass("salary", errors, true)}
                  min="1"
                  placeholder="85000"
                  type="number"
                />
                <FieldError>{errors.salary?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Salary Period
                <select
                  value={formData.salaryPeriod}
                  onChange={(event) =>
                    onChange("salaryPeriod", event.target.value)
                  }
                  className={s.getSelectClass("salaryPeriod", formErrors)}
                >
                  {salaryPeriodOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <FieldError>{formErrors.salaryPeriod}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                <span className={s.joiningDateLabel}>
                  Joining Date
                  {isEditMode && <Lock className={s.lockIcon} />}
                </span>
                <input
                  value={formData.joiningDate}
                  onChange={(event) =>
                    onChange("joiningDate", event.target.value)
                  }
                  className={s.getJoiningDateClass(isEditMode, formErrors)}
                  disabled={isEditMode}
                  min={todayDate}
                  type="date"
                />
                <FieldError>{formErrors.joiningDate}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Bank Name
                <input
                  //   value={formData.bankName}
                  //   onChange={(event) => onChange("bankName", event.target.value)}

                  // {...register("bankName", {
                  //   required: "bank Name is required",
                  // })}
                  {...register("bankName")}
                  className={s.getInputClass("bankName", errors, true)}
                  placeholder="HDFC Bank"
                />
                <FieldError>{errors.bankName?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Account Number
                <input
                  //   value={formData.accountNumber}
                  //   onChange={(event) =>
                  //     onChange("accountNumber", event.target.value)
                  //   }

                  // {...register("accountNumber", {
                  //   required: "Account Number is required",
                  //   pattern: {
                  //     value: /^[0-9]{9,18}$/,
                  //     message: "Account number must contain 9 to 18 digits",
                  //   },
                  // })}
                  {...register("accountNumber")}
                  className={s.getInputClass("accountNumber", errors, true)}
                  inputMode="numeric"
                  maxLength={18}
                  placeholder="501234567890"
                />
                <FieldError>{errors.accountNumber?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                IFSC Code
                <input
                  //   value={formData.ifscCode}
                  //   onChange={(event) => onChange("ifscCode", event.target.value)}
                  // {...register("ifscCode", {
                  //   required: " IFSC Code is required",
                  //   pattern: {
                  //     value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                  //     message: "Enter a valid IFSC code",
                  //   },
                  // })}
                  {...register("ifscCode")}
                  className={s.getInputClass("ifscCode", errors, true)}
                  maxLength={11}
                  placeholder="HDFC0001234"
                />
                <FieldError>{errors.ifscCode?.message}</FieldError>
              </label>

              <label className={s.fieldLabel}>
                Account Status
                <select
                  value={formData.accountStatus}
                  onChange={(event) =>
                    onChange("accountStatus", event.target.value)
                  }
                  className={s.getSelectClass("accountStatus", formErrors)}
                >
                  {accountOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={s.actions}>
            <button type="button" onClick={onClose} className={s.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={s.submitButton}>
              {loading ? (
                <>
                  <svg className={s.spinner} fill="none" viewBox="0 0 24 24">
                    <circle
                      className={s.spinnerCircle}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className={s.spinnerPath}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className={s.submitIcon} />
                  {isEditMode ? "Save Changes" : "Add Employee"}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default EmployeeFormModal;
