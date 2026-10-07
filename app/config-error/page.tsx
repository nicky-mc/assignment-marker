export default function ConfigErrorPage() {
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="flex flex-col gap-3 rounded-[14px] border-2 border-surface-border bg-surface p-5 text-ink">
          <h1 className="text-2xl font-semibold">This service is not available</h1>
          <p className="text-sm" role="alert">
            This deployment has not been set up safely, so marking is switched off. Nothing has been sent
            anywhere. Please contact an administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
