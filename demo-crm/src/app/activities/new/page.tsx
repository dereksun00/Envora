import ActivityForm from "@/components/ActivityForm";

export default function NewActivityPage() {
  return (
    <>
      <div className="top-header">
        <h2 className="page-title">New Activity</h2>
      </div>
      <div className="page-container">
        <ActivityForm />
      </div>
    </>
  );
}
