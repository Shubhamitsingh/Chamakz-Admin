const PageHeader = ({ title, description, actions }) => (
  <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-3">
    <div>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
)

export default PageHeader
