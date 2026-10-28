import mongoose from "mongoose";

// fromDate / toDate are stored at UTC midnight and are inclusive.
const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true },
);

export default mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
