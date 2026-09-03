import { LegalLayout, LegalDisclaimer, H2, P, Ul } from '../../components/legal/LegalLayout'

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Política de Privacidade (LGPD)" updatedAt="3 de setembro de 2026">
      <LegalDisclaimer />

      <P>
        Esta Política de Privacidade descreve como a <strong>Hello Inova</strong> coleta, usa, armazena, compartilha
        e protege dados pessoais no contexto da plataforma de catálogo e agendamento online, em conformidade com a
        Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e com o Marco Civil da Internet (Lei nº
        12.965/2014).
      </P>

      <H2>1. Papéis: quem é o controlador dos dados</H2>
      <P>
        A Hello Inova atua como <strong>controladora</strong> dos dados cadastrais da Empresa Contratante e de seus
        Usuários Administrativos (nome, e-mail, telefone, senha em formato criptografado, dados de cobrança
        processados pelo gateway de pagamento). Em relação aos dados dos Clientes Finais que a Empresa cadastra na
        Plataforma (nome, telefone/WhatsApp, e-mail, histórico de agendamentos), a Hello Inova atua como{' '}
        <strong>operadora</strong>, tratando esses dados exclusivamente conforme as instruções e finalidades
        definidas pela Empresa, que é a controladora desses dados perante seus próprios clientes.
      </P>

      <H2>2. Quais dados coletamos</H2>
      <Ul>
        <li><strong>Dados cadastrais da Empresa e de Usuários Administrativos:</strong> nome, e-mail, telefone, senha (armazenada apenas como hash criptográfico, nunca em texto puro).</li>
        <li><strong>Dados de pagamento:</strong> processados diretamente pelo gateway Asaas; a Hello Inova armazena apenas o status da cobrança, a bandeira e os últimos 4 dígitos do cartão para referência — nunca o número completo, a data de validade ou o código de segurança do cartão.</li>
        <li><strong>Dados inseridos pela Empresa sobre seus Clientes Finais:</strong> nome, telefone/WhatsApp, e-mail e histórico de agendamentos, sob responsabilidade da Empresa como controladora.</li>
        <li><strong>Dados de acesso e cookies:</strong> endereço IP, cookie de sessão para manter o login autenticado (ver Política de Cookies).</li>
      </Ul>

      <H2>3. Bases legais para o tratamento</H2>
      <P>
        Tratamos dados pessoais com fundamento nas seguintes bases legais previstas no artigo 7º da LGPD, conforme o
        caso: (i) execução de contrato ou de procedimentos preliminares relacionados a ele, ao viabilizar o acesso e
        o funcionamento da Plataforma contratada; (ii) cumprimento de obrigação legal ou regulatória, incluindo
        obrigações fiscais e de prevenção a fraudes no processamento de pagamentos; e (iii) legítimo interesse, para
        garantir a segurança da Plataforma e prevenir uso indevido, sempre respeitando os direitos e liberdades
        fundamentais dos titulares.
      </P>

      <H2>4. Finalidade do tratamento</H2>
      <Ul>
        <li>Viabilizar o cadastro, a autenticação e o acesso ao painel administrativo.</li>
        <li>Processar a cobrança recorrente da assinatura da Plataforma.</li>
        <li>Enviar comunicações operacionais, como avisos de vencimento e cobrança.</li>
        <li>Prestar suporte técnico e atender solicitações da Empresa.</li>
        <li>Cumprir obrigações legais e regulatórias aplicáveis.</li>
      </Ul>

      <H2>5. Compartilhamento de dados com terceiros</H2>
      <P>
        Para operar a Plataforma, compartilhamos dados estritamente necessários com os seguintes parceiros, todos
        contratualmente obrigados a tratar os dados com o mesmo nível de proteção:
      </P>
      <Ul>
        <li><strong>Asaas</strong> (gateway de pagamentos): recebe os dados de cartão de crédito e cobrança diretamente, para processar a mensalidade.</li>
        <li><strong>Provedores de hospedagem e infraestrutura</strong> (como Vercel e seus provedores de banco de dados e armazenamento de arquivos): hospedam a Plataforma e os dados armazenados nela.</li>
        <li><strong>WhatsApp:</strong> quando a Hello Inova ou a Empresa optam por enviar mensagens de cobrança ou contato por esse canal, a mensagem é enviada por meio da própria conta de WhatsApp do remetente.</li>
      </Ul>
      <P>Não vendemos dados pessoais a terceiros para fins de marketing.</P>

      <H2>6. Armazenamento e segurança</H2>
      <P>
        Adotamos medidas técnicas e administrativas razoáveis para proteger os dados pessoais contra acessos não
        autorizados e situações de destruição, perda, alteração, comunicação ou difusão indevidas, incluindo: senhas
        armazenadas exclusivamente como hash criptográfico (bcrypt), conexões criptografadas (HTTPS/TLS) em todas as
        comunicações, e cookie de sessão do tipo <em>httpOnly</em>, inacessível a scripts do navegador.
      </P>

      <H2>7. Prazo de retenção</H2>
      <P>
        Mantemos os dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta Política e as
        obrigações legais aplicáveis (incluindo prazos fiscais e regulatórios), sendo eliminados ou anonimizados
        após esse período, ressalvadas as hipóteses legais de retenção.
      </P>

      <H2>8. Seus direitos como titular de dados</H2>
      <P>Nos termos do artigo 18 da LGPD, você pode solicitar, a qualquer momento:</P>
      <Ul>
        <li>Confirmação da existência de tratamento de seus dados;</li>
        <li>Acesso aos dados;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD;</li>
        <li>Portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa;</li>
        <li>Eliminação dos dados tratados com base no consentimento;</li>
        <li>Informação sobre entidades públicas e privadas com as quais os dados são compartilhados;</li>
        <li>Informação sobre a possibilidade de não fornecer consentimento e suas consequências;</li>
        <li>Revogação do consentimento, quando o tratamento se basear nele.</li>
      </Ul>
      <P>
        Solicitações relativas a Clientes Finais cadastrados por uma Empresa devem ser direcionadas primeiramente à
        própria Empresa, controladora desses dados; a Hello Inova, como operadora, dará suporte à Empresa para
        atendê-las.
      </P>

      <H2>9. Como exercer seus direitos</H2>
      <P>
        Solicitações podem ser feitas pelo canal de atendimento oficial da Hello Inova. Poderemos solicitar
        informações adicionais para confirmar a identidade do solicitante antes de atender ao pedido.
      </P>

      <H2>10. Transferência internacional de dados</H2>
      <P>
        A infraestrutura de hospedagem utilizada pela Plataforma pode processar dados em servidores localizados fora
        do Brasil. Nesses casos, a transferência ocorre com base nas hipóteses previstas no artigo 33 da LGPD,
        exigindo dos provedores envolvidos garantias adequadas de proteção de dados equivalentes às previstas na
        legislação brasileira.
      </P>

      <H2>11. Alterações desta Política</H2>
      <P>
        Esta Política pode ser atualizada periodicamente. A versão vigente estará sempre disponível nesta página,
        com a data da última atualização indicada no topo.
      </P>

      <H2>12. Legislação aplicável</H2>
      <P>
        Esta Política é regida pela legislação brasileira, em especial a Lei nº 13.709/2018 (LGPD) e a Lei nº
        12.965/2014 (Marco Civil da Internet).
      </P>
    </LegalLayout>
  )
}
