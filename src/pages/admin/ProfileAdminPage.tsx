import { ProfileForm } from '../../components/account/ProfileForm'

export function ProfileAdminPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Altere o e-mail e a senha usados para entrar neste painel.</p>
      </div>
      <ProfileForm />
    </div>
  )
}
