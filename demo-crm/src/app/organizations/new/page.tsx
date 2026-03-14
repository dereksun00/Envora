import OrganizationForm from "@/components/OrganizationForm";

export default function NewOrganizationPage() {
  return (
    <>
      <div className="top-header">
        <h2 className="page-title">New Organization</h2>
      </div>
      <div className="page-container">
        <OrganizationForm />
      </div>
    </>
  );
}
