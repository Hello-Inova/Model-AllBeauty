import { LegalLayout, LegalDisclaimer, H2, P, Ul } from '../../components/legal/LegalLayout'

export function CookiesPolicyPage() {
  return (
    <LegalLayout title="Política de Cookies" updatedAt="3 de setembro de 2026">
      <LegalDisclaimer />

      <P>
        Esta Política de Cookies explica como a <strong>Hello Inova</strong> utiliza cookies e tecnologias
        semelhantes na plataforma de catálogo e agendamento online, em linha com a Lei Geral de Proteção de Dados
        (LGPD — Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).
      </P>

      <H2>1. O que são cookies</H2>
      <P>
        Cookies são pequenos arquivos de texto armazenados pelo navegador do dispositivo utilizado para acessar a
        Plataforma. Eles permitem, entre outras funções, manter o usuário autenticado entre uma página e outra sem
        precisar informar login e senha a cada acesso.
      </P>

      <H2>2. Cookies que utilizamos</H2>
      <Ul>
        <li>
          <strong>Cookie de sessão (estritamente necessário):</strong> um único cookie, do tipo <em>httpOnly</em> e{' '}
          <em>Secure</em>, usado exclusivamente para manter sua sessão autenticada no painel administrativo depois do
          login. Ele não é acessível por scripts do navegador, expira automaticamente após um período de inatividade
          e é removido ao clicar em "Sair". Sem esse cookie, o painel administrativo não funciona.
        </li>
      </Ul>
      <P>
        Atualmente a Plataforma <strong>não utiliza cookies de terceiros para publicidade, rastreamento entre sites
        ou análise de comportamento</strong>. Caso isso mude no futuro (por exemplo, com a adoção de uma ferramenta
        de analytics), esta Política será atualizada antes da mudança entrar em vigor, e um novo consentimento
        poderá ser solicitado quando exigido por lei.
      </P>

      <H2>3. Cookies essenciais x não essenciais</H2>
      <P>
        O único cookie usado hoje pela Plataforma é <strong>estritamente necessário</strong> ao funcionamento do
        serviço (manter você logado), categoria que, segundo a LGPD e a prática de mercado, dispensa consentimento
        prévio específico, pois sem ele o serviço solicitado (acesso ao painel) simplesmente não pode ser prestado.
        Ainda assim, pedimos sua ciência sobre este uso no primeiro acesso, junto com os demais documentos legais da
        Plataforma.
      </P>

      <H2>4. Como gerenciar ou desativar cookies</H2>
      <P>
        Você pode configurar seu navegador para bloquear ou apagar cookies a qualquer momento, nas configurações de
        privacidade do próprio navegador. Como o cookie de sessão é essencial para a autenticação, bloqueá-lo
        impedirá o acesso ao painel administrativo — nesse caso, será necessário fazer login novamente a cada
        navegação.
      </P>

      <H2>5. Consentimento</H2>
      <P>
        Ao aceitar os documentos legais no primeiro acesso ao painel administrativo, você confirma estar ciente do
        uso do cookie de sessão descrito nesta Política, necessário para o funcionamento do serviço.
      </P>

      <H2>6. Alterações desta Política</H2>
      <P>
        Esta Política pode ser atualizada para refletir mudanças na forma como a Plataforma utiliza cookies. A versão
        vigente estará sempre disponível nesta página.
      </P>
    </LegalLayout>
  )
}
