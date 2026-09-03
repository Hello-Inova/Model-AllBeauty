import { LegalLayout, LegalDisclaimer, H2, P, Ul } from '../../components/legal/LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso" updatedAt="3 de setembro de 2026">
      <LegalDisclaimer />

      <P>
        Estes Termos de Uso ("Termos") regulam a utilização da plataforma de catálogo e agendamento online
        white-label operada pela <strong>Hello Inova</strong> ("Plataforma", "nós") pela empresa contratante
        ("Empresa", "você") e por seus usuários autorizados a acessar o painel administrativo. Ao criar uma conta,
        acessar ou utilizar o painel administrativo, você declara que leu, compreendeu e concorda integralmente com
        estes Termos, com a Política de Privacidade e com a Política de Cookies.
      </P>

      <H2>1. Definições</H2>
      <Ul>
        <li><strong>Plataforma:</strong> o sistema de catálogo de serviços, agendamento online e painel administrativo fornecido pela Hello Inova.</li>
        <li><strong>Empresa Contratante:</strong> a pessoa jurídica (ou profissional autônomo) que contrata o uso da Plataforma para seu próprio negócio.</li>
        <li><strong>Usuário Administrativo:</strong> qualquer pessoa autorizada pela Empresa a acessar o painel com login e senha próprios.</li>
        <li><strong>Cliente Final:</strong> a pessoa que agenda ou consulta serviços no site publicado da Empresa.</li>
        <li><strong>Site Publicado:</strong> a página pública da Empresa gerada pela Plataforma (endereço no formato <code>/empresa/&lt;identificador&gt;</code>).</li>
      </Ul>

      <H2>2. Objeto</H2>
      <P>
        A Plataforma fornece à Empresa um site institucional e de agendamento online, além de um painel
        administrativo para gerenciar serviços, categorias, profissionais, clientes, agendamentos, galeria de
        imagens, depoimentos e configurações de identidade visual, mediante o pagamento da mensalidade
        correspondente ao plano contratado, salvo isenção expressamente concedida pela Hello Inova.
      </P>

      <H2>3. Cadastro e responsabilidade pela conta</H2>
      <P>
        A Empresa é responsável por fornecer informações verdadeiras, completas e atualizadas no cadastro, e por
        manter a confidencialidade das credenciais (e-mail e senha) de todos os Usuários Administrativos que
        autorizar. Toda atividade realizada com essas credenciais é de responsabilidade da Empresa, que deve
        comunicar imediatamente a Hello Inova em caso de suspeita de uso não autorizado ou vazamento de senha.
      </P>

      <H2>4. Planos, preços e cobrança</H2>
      <P>
        A Plataforma é oferecida nos planos Mensal, Semestral e Anual, cujos valores e eventuais descontos por
        ciclo mais longo são exibidos na página de Assinatura do painel administrativo e podem ser atualizados pela
        Hello Inova a qualquer momento, com efeitos apenas sobre cobranças futuras. Salvo quando a Empresa estiver
        marcada como isenta pela Hello Inova, a cobrança é <strong>recorrente e automática</strong>, processada
        exclusivamente via <strong>cartão de crédito</strong> através do gateway de pagamentos Asaas, e se renova
        automaticamente ao final de cada ciclo enquanto a assinatura estiver ativa e não for cancelada. A Empresa
        pode consultar o histórico de cobranças e os dias restantes até o próximo vencimento a qualquer momento no
        painel administrativo, que também exibirá um aviso quando o vencimento estiver próximo.
      </P>

      <H2>5. Inadimplência e suspensão</H2>
      <P>
        Em caso de falha na cobrança (por exemplo, cartão recusado ou vencido), a Hello Inova poderá tentar cobrar
        novamente e notificará a Empresa pelos canais de contato cadastrados, incluindo WhatsApp. A persistência do
        atraso pode resultar na suspensão temporária do acesso ao painel administrativo e do Site Publicado,
        preservando os dados da Empresa por um período razoável para regularização antes de qualquer exclusão
        definitiva.
      </P>

      <H2>6. Propriedade intelectual</H2>
      <P>
        O código-fonte, o design, as marcas e demais elementos da Plataforma pertencem à Hello Inova ou a seus
        licenciantes e são protegidos pela legislação de propriedade intelectual aplicável. O conteúdo inserido pela
        Empresa (textos, imagens, dados de serviços e clientes) permanece de propriedade da Empresa, que concede à
        Hello Inova a licença necessária para hospedar, processar e exibir esse conteúdo exclusivamente para prestar
        o serviço contratado.
      </P>

      <H2>7. Obrigações da Empresa</H2>
      <Ul>
        <li>Utilizar a Plataforma para finalidades lícitas, sem violar direitos de terceiros ou a legislação vigente.</li>
        <li>
          Atuar como <strong>controladora</strong>, nos termos da LGPD, dos dados pessoais de seus próprios Clientes
          Finais inseridos na Plataforma (nome, telefone, histórico de agendamentos), sendo responsável por obter as
          bases legais adequadas para tratá-los e por atender às solicitações desses titulares.
        </li>
        <li>Não utilizar a Plataforma para envio de spam, conteúdo enganoso, discriminatório ou ilegal.</li>
        <li>Manter suas informações de contato e de cobrança sempre atualizadas.</li>
      </Ul>

      <H2>8. Disponibilidade e limitação de responsabilidade</H2>
      <P>
        A Hello Inova envida seus melhores esforços para manter a Plataforma disponível e funcionando corretamente,
        mas não garante disponibilidade ininterrupta, estando o serviço sujeito a manutenções programadas,
        indisponibilidades de provedores de infraestrutura (hospedagem, banco de dados, gateway de pagamento) e
        outros eventos fora de seu controle razoável. Na máxima extensão permitida pela lei, a Hello Inova não se
        responsabiliza por lucros cessantes ou danos indiretos decorrentes do uso ou da impossibilidade de uso da
        Plataforma.
      </P>

      <H2>9. Proteção de dados pessoais</H2>
      <P>
        O tratamento de dados pessoais realizado pela Hello Inova é descrito em detalhe na{' '}
        <a href="/legal/privacidade" className="text-[var(--color-primary)] hover:underline">Política de Privacidade</a>, parte integrante destes Termos.
      </P>

      <H2>10. Alterações destes Termos</H2>
      <P>
        A Hello Inova pode atualizar estes Termos a qualquer momento para refletir mudanças no serviço ou na
        legislação aplicável. Alterações relevantes serão comunicadas por e-mail ou aviso no painel administrativo,
        e o uso continuado da Plataforma após a alteração constitui aceite dos novos Termos.
      </P>

      <H2>11. Rescisão</H2>
      <P>
        A Empresa pode solicitar o cancelamento de sua conta a qualquer momento pelos canais de atendimento da Hello
        Inova. A Hello Inova pode suspender ou encerrar o acesso de uma Empresa que violar estes Termos, mediante
        aviso prévio sempre que razoavelmente possível.
      </P>

      <H2>12. Legislação aplicável e foro</H2>
      <P>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio da
        Hello Inova para dirimir quaisquer controvérsias decorrentes destes Termos, ressalvada a competência de foro
        diverso quando imposta por norma de proteção ao consumidor.
      </P>

      <H2>13. Contato</H2>
      <P>Dúvidas sobre estes Termos podem ser enviadas para o canal de atendimento oficial da Hello Inova.</P>
    </LegalLayout>
  )
}
