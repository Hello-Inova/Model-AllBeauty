import type {
  Appointment,
  Banner,
  BlockedDate,
  Business,
  BusinessBackup,
  Category,
  Customer,
  DaySchedule,
  GalleryImage,
  ImageAsset,
  Professional,
  Service,
  Testimonial,
} from '../types'
import { makeId, makeAppointmentCode } from '../utils/id'
import { uImg } from '../utils/unsplash'
import { addDays, toIsoDate } from '../utils/format'
import { slugify } from '../utils/slug'

// ---------------------------------------------------------------------------
// "Beauty Demo" — the fully-populated showcase business every fresh install
// ships with. Every image below is a real, appropriately-licensed Unsplash
// photograph relevant to the content it illustrates (see README for the
// full attribution/limitations note). All of it is clearly demonstration
// content: business.demo === true and every testimonial carries demo: true.
// ---------------------------------------------------------------------------

function img(url: string, alt: string): ImageAsset {
  return { id: makeId('img'), type: 'url', url, alt, createdAt: new Date().toISOString() }
}

// ---- Photo pool (curated Unsplash photos, grouped by subject) -------------
const PH = {
  heroSalon: 'https://images.unsplash.com/photo-1695527081848-1e46c06e6458',
  salon2: 'https://images.unsplash.com/photo-1626383137804-ff908d2753a2',
  salon3: 'https://images.unsplash.com/photo-1695527081874-b674c46f40fb',
  salon4: 'https://images.unsplash.com/photo-1746723378067-83a345ff3160',
  salon5: 'https://images.unsplash.com/photo-1637777277435-3c44f82fd0c9',
  salon6: 'https://images.unsplash.com/photo-1676536162793-faa565d976d4',
  salon7: 'https://images.unsplash.com/photo-1626383120723-2a941488860d',
  salon8: 'https://images.unsplash.com/photo-1695527081827-fdbc4e77be9b',
  salon9: 'https://images.unsplash.com/photo-1747128706262-b604e66e1abb',

  hairCut1: 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0',
  hairCut2: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f',
  hairColor: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6',
  hairBlowout: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
  hairBlowout2: 'https://images.unsplash.com/photo-1629397685944-7073f5589754',
  hairStyle3: 'https://images.unsplash.com/photo-1734111719430-fe4a3973f8af',
  hairStyle4: 'https://images.unsplash.com/photo-1675034743339-0b0747047727',
  hairStyle5: 'https://images.unsplash.com/photo-1626379501846-0df4067b8bb9',

  barber1: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1',
  barber2: 'https://images.unsplash.com/photo-1647140655214-e4a2d914971f',
  barber3: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5',
  barber4: 'https://images.unsplash.com/photo-1635273051937-a0ddef9573b6',

  nails1: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53',
  nails2: 'https://images.unsplash.com/photo-1610992015762-45dca7fa3a85',
  nails3: 'https://images.unsplash.com/photo-1690749138086-7422f71dc159',
  nails4: 'https://images.unsplash.com/photo-1630843599725-32ead7671867',
  nails5: 'https://images.unsplash.com/photo-1610992015836-7c249d75782d',
  nails6: 'https://images.unsplash.com/photo-1599206676335-193c82b13c9e',

  brows1: 'https://images.unsplash.com/photo-1709477542149-f4e0e21d590b',
  brows2: 'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b',
  lashes1: 'https://images.unsplash.com/photo-1735151226446-1d364b4adc2f',
  lashes2: 'https://images.unsplash.com/photo-1564278692313-b2d65996fc93',

  spa1: 'https://images.unsplash.com/photo-1741522509438-a120c0bb5e88',
  spa2: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2',
  spa3: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1',
  spa4: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15',
  spa5: 'https://images.unsplash.com/photo-1620733723572-11c53f73a416',
  spa6: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874',

  facial1: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9',
  facial2: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881',
  facial3: 'https://images.unsplash.com/photo-1731514771613-991a02407132',
  facial4: 'https://images.unsplash.com/photo-1552693673-1bf958298935',

  makeup1: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
  makeup2: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
  makeup3: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',

  waxing1: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31',

  proCamila: 'https://images.unsplash.com/photo-1777125259057-67d1dae9caad',
  proRafael: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  proJuliana: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  proBeatriz: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993',
  proFernanda: 'https://images.unsplash.com/photo-1562337404-3044c84ac061',
  proBruno: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',

  testWoman1: 'https://images.unsplash.com/photo-1604072366595-e75dc92d6bdc',
  testWoman2: 'https://images.unsplash.com/photo-1607569708758-0270aa4651bd',
  testWoman3: 'https://images.unsplash.com/photo-1589729132389-8f0e0b55b91e',
  testMan1: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec',
  testMan2: 'https://images.unsplash.com/photo-1592234789031-94bf65f630ed',
  testMan3: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3',
}

const businessHours: DaySchedule[] = [
  { weekday: 0, active: false, periods: [] },
  { weekday: 1, active: true, periods: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { weekday: 2, active: true, periods: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { weekday: 3, active: true, periods: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { weekday: 4, active: true, periods: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { weekday: 5, active: true, periods: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '19:00' }] },
  { weekday: 6, active: true, periods: [{ start: '09:00', end: '15:00' }] },
]

export function buildDemoBackup(): BusinessBackup {
  const businessId = 'biz_demo_beauty'
  const now = new Date().toISOString()

  const business: Business = {
    id: businessId,
    slug: 'beauty-demo',
    name: 'Beauty Demo Studio',
    displayName: 'Beauty Demo',
    description:
      'Um espaço pensado para o seu bem-estar e autoestima. Cabelo, unhas, sobrancelhas, estética facial e massagem em um só lugar, com uma equipe apaixonada por cuidar de você. (Dados demonstrativos)',
    segment: 'Salão de beleza & estética',
    logo: img(uImg(PH.heroSalon, 200, 200), 'Logo Beauty Demo'),
    favicon: img(uImg(PH.heroSalon, 64, 64), 'Favicon Beauty Demo'),
    coverImage: img(uImg(PH.salon4, 1600, 900), 'Interior do salão Beauty Demo'),
    heroImage: img(uImg(PH.heroSalon, 1600, 1000), 'Recepção do salão Beauty Demo'),
    phone: '(11) 4002-8922',
    whatsapp: '5511987654321',
    email: 'contato@beautydemo.com.br',
    instagram: 'https://instagram.com/beautydemo',
    facebook: 'https://facebook.com/beautydemo',
    tiktok: 'https://tiktok.com/@beautydemo',
    youtube: '',
    website: '',
    address: 'Rua das Flores, 123 - Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    zipCode: '01415-000',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    primaryColor: '#b3873e',
    secondaryColor: '#2b2320',
    accentColor: '#d9a441',
    backgroundColor: '#fffdfa',
    foregroundColor: '#221b15',
    theme: 'light',
    active: true,
    demo: true,
    plan: 'profissional',
    billingType: 'isento',
    billingPlan: 'mensal',
    subscriptionStatus: 'sem_assinatura',
    workingHours: businessHours,
    bookingPolicies: {
      minAdvanceMinutes: 60,
      maxAdvanceDays: 45,
      cancellationWindowHours: 24,
      allowReschedule: true,
      bufferBetweenAppointmentsMinutes: 10,
      lateToleranceMinutes: 15,
      requireEmail: false,
      requireNotes: false,
      paymentPolicy: 'pay_on_site',
    },
    createdAt: now,
    updatedAt: now,
  }

  const cat = (name: string, order: number, description: string): Category => ({
    id: makeId('cat'),
    businessId,
    name,
    slug: slugify(name),
    description,
    order,
    active: true,
  })

  const catCabelo = cat('Cabelo', 0, 'Cortes, coloração e finalizações para todos os estilos.')
  const catUnhas = cat('Unhas', 1, 'Manicure, pedicure e nail art.')
  const catSobrancelhas = cat('Sobrancelhas & Cílios', 2, 'Design, henna e extensão de cílios.')
  const catFacial = cat('Estética Facial', 3, 'Limpeza de pele, peeling e tratamentos faciais.')
  const catSpa = cat('Massagem & Spa', 4, 'Massagens relaxantes e terapêuticas.')
  const catMaquiagem = cat('Maquiagem', 5, 'Maquiagem social, para eventos e noivas.')
  const catDepilacao = cat('Depilação', 6, 'Depilação com cera para rosto e corpo.')

  const categories = [catCabelo, catUnhas, catSobrancelhas, catFacial, catSpa, catMaquiagem, catDepilacao]

  const proCamila: Professional = {
    id: makeId('pro'),
    businessId,
    name: 'Camila Duarte',
    photo: img(uImg(PH.proCamila, 400, 400), 'Camila Duarte'),
    description: 'Cabeleireira e colorista com 12 anos de experiência, apaixonada por transformações.',
    specialties: ['Coloração', 'Corte feminino', 'Escova'],
    phone: '(11) 91111-0001',
    serviceIds: [],
    workingHours: businessHours,
    useBusinessHours: true,
    active: true,
    order: 0,
  }
  const proRafael: Professional = {
    id: makeId('pro'),
    businessId,
    name: 'Rafael Torres',
    photo: img(uImg(PH.proRafael, 400, 400), 'Rafael Torres'),
    description: 'Barbeiro especializado em cortes modernos e barboterapia.',
    specialties: ['Corte masculino', 'Barba'],
    phone: '(11) 91111-0002',
    serviceIds: [],
    workingHours: businessHours,
    useBusinessHours: true,
    active: true,
    order: 1,
  }
  const proJuliana: Professional = {
    id: makeId('pro'),
    businessId,
    name: 'Juliana Alves',
    photo: img(uImg(PH.proJuliana, 400, 400), 'Juliana Alves'),
    description: 'Especialista em unhas, referência em nail art na região.',
    specialties: ['Manicure', 'Pedicure', 'Nail art'],
    phone: '(11) 91111-0003',
    serviceIds: [],
    workingHours: businessHours,
    useBusinessHours: true,
    active: true,
    order: 2,
  }
  const proBeatriz: Professional = {
    id: makeId('pro'),
    businessId,
    name: 'Beatriz Nunes',
    photo: img(uImg(PH.proBeatriz, 400, 400), 'Beatriz Nunes'),
    description: 'Designer de sobrancelhas e especialista em extensão de cílios.',
    specialties: ['Sobrancelhas', 'Cílios'],
    phone: '(11) 91111-0004',
    serviceIds: [],
    workingHours: businessHours,
    useBusinessHours: true,
    active: true,
    order: 3,
  }
  const proFernanda: Professional = {
    id: makeId('pro'),
    businessId,
    name: 'Fernanda Costa',
    photo: img(uImg(PH.proFernanda, 400, 400), 'Fernanda Costa'),
    description: 'Esteticista e massoterapeuta, especialista em relaxamento e cuidados faciais.',
    specialties: ['Limpeza de pele', 'Massagem', 'Peeling'],
    phone: '(11) 91111-0005',
    serviceIds: [],
    workingHours: businessHours,
    useBusinessHours: true,
    active: true,
    order: 4,
  }
  const proBruno: Professional = {
    id: makeId('pro'),
    businessId,
    name: 'Bruno Lima',
    photo: img(uImg(PH.proBruno, 400, 400), 'Bruno Lima'),
    description: 'Maquiador profissional para eventos, noivas e produções.',
    specialties: ['Maquiagem social', 'Maquiagem para noivas'],
    phone: '(11) 91111-0006',
    serviceIds: [],
    workingHours: businessHours,
    useBusinessHours: true,
    active: true,
    order: 5,
  }

  const professionals = [proCamila, proRafael, proJuliana, proBeatriz, proFernanda, proBruno]

  type SvcInput = Omit<Service, 'id' | 'businessId' | 'professionalIds'> & { professionals: Professional[] }

  const svcInputs: SvcInput[] = [
    {
      categoryId: catCabelo.id,
      name: 'Corte Feminino',
      slug: 'corte-feminino',
      shortDescription: 'Corte personalizado para o seu estilo.',
      description: 'Avaliação de fio, corte personalizado e finalização básica incluída.',
      duration: 60,
      price: 120,
      image: img(uImg(PH.hairCut1, 900, 700), 'Corte de cabelo feminino'),
      active: true,
      featured: true,
      order: 0,
      professionals: [proCamila],
    },
    {
      categoryId: catCabelo.id,
      name: 'Corte Masculino',
      slug: 'corte-masculino',
      shortDescription: 'Corte moderno com acabamento na navalha.',
      description: 'Corte completo com máquina e tesoura, acabamento na navalha e finalização.',
      duration: 45,
      price: 70,
      image: img(uImg(PH.barber1, 900, 700), 'Corte de cabelo masculino'),
      active: true,
      featured: false,
      order: 1,
      professionals: [proRafael],
    },
    {
      categoryId: catCabelo.id,
      name: 'Escova e Finalização',
      slug: 'escova-e-finalizacao',
      shortDescription: 'Escova modeladora com produtos profissionais.',
      description: 'Lavagem, escova modeladora e finalização com produtos de alta performance.',
      duration: 50,
      price: 90,
      image: img(uImg(PH.hairBlowout, 900, 700), 'Escova de cabelo'),
      active: true,
      featured: false,
      order: 2,
      professionals: [proCamila],
    },
    {
      categoryId: catCabelo.id,
      name: 'Coloração Completa',
      slug: 'coloracao-completa',
      shortDescription: 'Cor uniforme com produtos de alta fixação.',
      description: 'Coloração global com produtos profissionais, inclui tratamento pós-química.',
      duration: 150,
      price: 280,
      promotionalPrice: 250,
      image: img(uImg(PH.hairColor, 900, 700), 'Coloração de cabelo'),
      active: true,
      featured: true,
      order: 3,
      professionals: [proCamila],
    },
    {
      categoryId: catUnhas.id,
      name: 'Manicure Tradicional',
      slug: 'manicure-tradicional',
      shortDescription: 'Cutilagem, esmaltação e hidratação das mãos.',
      description: 'Cuidado completo das unhas das mãos com esmaltação a sua escolha.',
      duration: 45,
      price: 45,
      image: img(uImg(PH.nails1, 900, 700), 'Manicure'),
      active: true,
      featured: false,
      order: 4,
      professionals: [proJuliana],
    },
    {
      categoryId: catUnhas.id,
      name: 'Pedicure Spa',
      slug: 'pedicure-spa',
      shortDescription: 'Ritual relaxante para os pés com esfoliação.',
      description: 'Banho relaxante, esfoliação, cutilagem e esmaltação dos pés.',
      duration: 60,
      price: 65,
      image: img(uImg(PH.nails2, 900, 700), 'Pedicure spa'),
      active: true,
      featured: false,
      order: 5,
      professionals: [proJuliana],
    },
    {
      categoryId: catSobrancelhas.id,
      name: 'Design de Sobrancelhas',
      slug: 'design-de-sobrancelhas',
      shortDescription: 'Modelagem com pinça e acabamento com henna.',
      description: 'Design personalizado de acordo com o formato do rosto.',
      duration: 30,
      price: 50,
      image: img(uImg(PH.brows1, 900, 700), 'Design de sobrancelhas'),
      active: true,
      featured: false,
      order: 6,
      professionals: [proBeatriz],
    },
    {
      categoryId: catSobrancelhas.id,
      name: 'Extensão de Cílios (Volume Russo)',
      slug: 'extensao-de-cilios-volume-russo',
      shortDescription: 'Técnica de volume para um olhar marcante.',
      description: 'Aplicação fio a fio com técnica de volume russo, resultado natural e duradouro.',
      duration: 120,
      price: 220,
      image: img(uImg(PH.lashes1, 900, 700), 'Extensão de cílios'),
      active: true,
      featured: true,
      order: 7,
      professionals: [proBeatriz],
    },
    {
      categoryId: catFacial.id,
      name: 'Limpeza de Pele Profunda',
      slug: 'limpeza-de-pele-profunda',
      shortDescription: 'Extração, esfoliação e máscara calmante.',
      description: 'Higienização, extração de cravos, esfoliação e máscara finalizadora.',
      duration: 75,
      price: 150,
      image: img(uImg(PH.facial1, 900, 700), 'Limpeza de pele'),
      active: true,
      featured: false,
      order: 8,
      professionals: [proFernanda],
    },
    {
      categoryId: catFacial.id,
      name: 'Peeling Facial',
      slug: 'peeling-facial',
      shortDescription: 'Renovação celular para pele uniforme.',
      description: 'Peeling de ácidos para uniformizar a textura e o tom da pele.',
      duration: 45,
      price: 180,
      image: img(uImg(PH.facial2, 900, 700), 'Peeling facial'),
      active: true,
      featured: false,
      order: 9,
      professionals: [proFernanda],
    },
    {
      categoryId: catSpa.id,
      name: 'Massagem Relaxante',
      slug: 'massagem-relaxante',
      shortDescription: 'Alívio de tensões com óleos essenciais.',
      description: 'Massagem corporal relaxante de corpo inteiro com óleos aromáticos.',
      duration: 60,
      price: 140,
      image: img(uImg(PH.spa1, 900, 700), 'Massagem relaxante'),
      active: true,
      featured: true,
      order: 10,
      professionals: [proFernanda],
    },
    {
      categoryId: catSpa.id,
      name: 'Massagem com Pedras Quentes',
      slug: 'massagem-com-pedras-quentes',
      shortDescription: 'Terapia com pedras vulcânicas aquecidas.',
      description: 'Massagem terapêutica com pedras quentes para relaxamento profundo.',
      duration: 90,
      price: 190,
      image: img(uImg(PH.spa4, 900, 700), 'Massagem com pedras quentes'),
      active: true,
      featured: false,
      order: 11,
      professionals: [proFernanda],
    },
    {
      categoryId: catMaquiagem.id,
      name: 'Maquiagem Social',
      slug: 'maquiagem-social',
      shortDescription: 'Make para festas e eventos especiais.',
      description: 'Maquiagem profissional para eventos, com produtos de alta duração.',
      duration: 60,
      price: 160,
      image: img(uImg(PH.makeup1, 900, 700), 'Maquiagem social'),
      active: true,
      featured: true,
      order: 12,
      professionals: [proBruno],
    },
    {
      categoryId: catDepilacao.id,
      name: 'Depilação Pernas Completas',
      slug: 'depilacao-pernas-completas',
      shortDescription: 'Depilação com cera quente, pele lisa por semanas.',
      description: 'Depilação completa das pernas com cera quente de alta qualidade.',
      duration: 45,
      price: 95,
      image: img(uImg(PH.waxing1, 900, 700), 'Depilação com cera'),
      active: true,
      featured: false,
      order: 13,
      professionals: [],
    },
  ]

  const services: Service[] = svcInputs.map((s) => {
    const { professionals: profs, ...rest } = s
    const service: Service = { ...rest, id: makeId('srv'), businessId, professionalIds: profs.map((p) => p.id) }
    return service
  })

  for (const s of services) {
    for (const proId of s.professionalIds) {
      const pro = professionals.find((p) => p.id === proId)
      if (pro) pro.serviceIds.push(s.id)
    }
  }

  // ---- Customers --------------------------------------------------------
  const customerNames: [string, string][] = [
    ['Ana Beatriz Souza', '5511998001001'],
    ['Marina Ribeiro', '5511998001002'],
    ['Patrícia Gomes', '5511998001003'],
    ['Larissa Fernandes', '5511998001004'],
    ['Camila Rocha', '5511998001005'],
    ['João Pedro Lima', '5511998001006'],
    ['Rodrigo Almeida', '5511998001007'],
    ['Beatriz Martins', '5511998001008'],
    ['Fernanda Dias', '5511998001009'],
    ['Gustavo Pereira', '5511998001010'],
    ['Vanessa Castro', '5511998001011'],
    ['Thiago Barbosa', '5511998001012'],
  ]
  const customers: Customer[] = customerNames.map(([name, whatsapp], i) => ({
    id: makeId('cus'),
    businessId,
    name,
    phone: whatsapp,
    whatsapp,
    email: `${name.toLowerCase().split(' ')[0]}${i}@example.com`,
    createdAt: addDays(toIsoDate(new Date()), -Math.floor(Math.random() * 200)) + 'T10:00:00.000Z',
  }))

  // ---- Appointments -------------------------------------------------------
  const today = toIsoDate(new Date())
  const appointments: Appointment[] = []
  let seq = 1
  function addAppointment(
    dayOffset: number,
    startTime: string,
    service: Service,
    professional: Professional | null,
    customer: Customer,
    status: Appointment['status'],
  ) {
    const [h, m] = startTime.split(':').map(Number)
    const endMinutes = h * 60 + m + service.duration
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
    appointments.push({
      id: makeId('apt'),
      businessId,
      code: makeAppointmentCode(seq++),
      serviceId: service.id,
      professionalId: professional ? professional.id : null,
      customerId: customer.id,
      date: addDays(today, dayOffset),
      startTime,
      endTime,
      duration: service.duration,
      price: service.promotionalPrice ?? service.price,
      status,
      createdAt: now,
      updatedAt: now,
    })
  }

  addAppointment(-6, '10:00', services[0], proCamila, customers[0], 'completed')
  addAppointment(-5, '14:00', services[4], proJuliana, customers[1], 'completed')
  addAppointment(-4, '11:00', services[6], proBeatriz, customers[2], 'completed')
  addAppointment(-3, '09:30', services[10], proFernanda, customers[3], 'completed')
  addAppointment(-2, '15:00', services[1], proRafael, customers[5], 'no_show')
  addAppointment(-1, '13:30', services[3], proCamila, customers[4], 'cancelled')
  addAppointment(0, '09:00', services[0], proCamila, customers[6], 'confirmed')
  addAppointment(0, '11:00', services[4], proJuliana, customers[7], 'confirmed')
  addAppointment(0, '16:00', services[7], proBeatriz, customers[8], 'pending')
  addAppointment(1, '10:00', services[12], proBruno, customers[9], 'confirmed')
  addAppointment(2, '14:30', services[8], proFernanda, customers[10], 'pending')
  addAppointment(3, '09:00', services[1], proRafael, customers[11], 'confirmed')

  // ---- Gallery ------------------------------------------------------------
  const galleryPhotos: [string, string][] = [
    [PH.salon2, 'Ambiente do salão'],
    [PH.salon3, 'Recepção Beauty Demo'],
    [PH.salon5, 'Área de atendimento'],
    [PH.salon6, 'Estação de cabelo'],
    [PH.salon7, 'Sala de estética'],
    [PH.hairStyle3, 'Resultado de finalização'],
    [PH.hairStyle4, 'Corte e escova'],
    [PH.nails3, 'Nail art'],
    [PH.nails4, 'Pedicure'],
    [PH.spa3, 'Sala de massagem'],
    [PH.spa5, 'Ritual de spa'],
    [PH.facial3, 'Tratamento facial'],
  ]
  const gallery: GalleryImage[] = galleryPhotos.map(([url, title], i) => ({
    id: makeId('gal'),
    businessId,
    image: img(uImg(url, 1000, 750), title),
    title,
    order: i,
    active: true,
  }))

  // ---- Testimonials ---------------------------------------------------------
  const testimonialInputs: { name: string; photo: string; text: string; rating: number }[] = [
    { name: 'Ana Beatriz S.', photo: PH.testWoman1, text: 'Atendimento incrível, saí do salão outra pessoa! Recomendo demais o Beauty Demo.', rating: 5 },
    { name: 'Rodrigo A.', photo: PH.testMan1, text: 'O corte ficou perfeito e o ambiente é muito agradável. Voltarei sempre.', rating: 5 },
    { name: 'Marina R.', photo: PH.testWoman2, text: 'Minha coloração ficou exatamente como eu queria. Equipe muito atenciosa.', rating: 5 },
    { name: 'Thiago B.', photo: PH.testMan2, text: 'Melhor barbearia que já fui, atenção aos detalhes impecável.', rating: 4 },
    { name: 'Patrícia G.', photo: PH.testWoman3, text: 'A massagem relaxante foi exatamente o que eu precisava depois de uma semana puxada.', rating: 5 },
    { name: 'Gustavo P.', photo: PH.testMan3, text: 'Agendamento online super prático e o atendimento presencial superou as expectativas.', rating: 4 },
  ]
  const testimonials: Testimonial[] = testimonialInputs.map((t, i) => ({
    id: makeId('tst'),
    businessId,
    name: t.name,
    photo: img(uImg(t.photo, 200, 200), t.name),
    text: t.text,
    rating: t.rating,
    active: true,
    demo: true,
    order: i,
  }))

  // ---- Banners ------------------------------------------------------------
  const banners: Banner[] = [
    {
      id: makeId('ban'),
      businessId,
      image: img(uImg(PH.salon4, 1600, 700), 'Promoção de coloração'),
      title: 'Coloração completa com condições especiais',
      subtitle: 'Agende esta semana e garanta seu horário',
      link: '/servicos/coloracao-completa',
      active: true,
      order: 0,
    },
    {
      id: makeId('ban'),
      businessId,
      image: img(uImg(PH.spa2, 1600, 700), 'Dia de spa'),
      title: 'Seu dia de spa começa aqui',
      subtitle: 'Massagens e tratamentos faciais para relaxar de verdade',
      link: '/servicos',
      active: true,
      order: 1,
    },
  ]

  // ---- Blocked dates --------------------------------------------------
  const blockedDates: BlockedDate[] = [
    {
      id: makeId('blk'),
      businessId,
      date: addDays(today, 10),
      allDay: true,
      reason: 'Feriado municipal (demonstração)',
    },
    {
      id: makeId('blk'),
      businessId,
      professionalId: proCamila.id,
      date: addDays(today, 4),
      allDay: true,
      reason: 'Folga da profissional',
    },
  ]

  return {
    business,
    categories,
    services,
    professionals,
    customers,
    appointments,
    gallery,
    testimonials,
    banners,
    blockedDates,
    exportedAt: now,
    version: 1,
  }
}
