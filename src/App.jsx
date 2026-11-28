import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Monitor, Building2, Users, LogOut, Plus, Pencil, Trash2,
  Search, RefreshCw, Server, CheckCircle2, AlertTriangle, X,
  ShieldCheck, Laptop, FileText, Copy, Printer, Check
} from 'lucide-react';

// Logo fiel à imagem InfraTrack (Cubo de nós + Tipografia bicolor)
function InfraTrackLogo({ light = false, size = 'md' }) {
  const iconSize = size === 'lg' ? 42 : 30;
  const textSize = size === 'lg' ? 'text-3xl' : 'text-xl';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 10L14 20.5V43.5L32 54" stroke={light ? '#93C5FD' : '#1B3668'} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 10L50 20.5V43.5L32 54" stroke="#2D7FF9" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 20.5L32 31L50 20.5" stroke="#2D7FF9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 31V54" stroke={light ? '#93C5FD' : '#1B3668'} strokeWidth="5" strokeLinecap="round" />
        <circle cx="32" cy="10" r="5" fill="#FFFFFF" stroke="#2D7FF9" strokeWidth="4" />
        <circle cx="14" cy="32" r="5" fill="#FFFFFF" stroke={light ? '#93C5FD' : '#1B3668'} strokeWidth="4" />
        <circle cx="50" cy="32" r="5" fill="#FFFFFF" stroke="#2D7FF9" strokeWidth="4" />
        <circle cx="32" cy="54" r="5" fill="#FFFFFF" stroke="#2D7FF9" strokeWidth="4" />
      </svg>
      <span className={`font-extrabold tracking-tight ${textSize}`}>
        <span className={light ? 'text-white' : 'text-[#1B3668]'}>Infra</span>
        <span className="text-[#2D7FF9]">Track</span>
      </span>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [activeTab, setActiveTab] = useState('ativos');
  const [ativos, setAtivos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal e Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Modal do Termo de Responsabilidade
  const [termoSelecionado, setTermoSelecionado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const [formAtivo, setFormAtivo] = useState({
    nome: '', tipo: 'Notebook', endereco_ip: '', endereco_mac: '',
    status: 'Ativo', id_setor: '', id_responsavel: ''
  });
  const [formSetor, setFormSetor] = useState({ nome: '', localizacao: '' });
  const [formResp, setFormResp] = useState({ nome: '', email: '', telefone: '' });
  const [formEntrega, setFormEntrega] = useState({
    colaborador: '', email_colaborador: '', usuario_rede: '',
    modelo_maquina: '', numero_serie: '', data_entrega: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) carregarDados();
  }, [session]);

  const showMsg = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
  };

  async function carregarDados() {
    setLoadingData(true);
    const [resAtivos, resSetores, resResp, resEntregas] = await Promise.all([
      supabase.from('ativo').select('*, setor(nome, localizacao), responsavel(nome, email)').order('id_ativo', { ascending: false }),
      supabase.from('setor').select('*').order('nome'),
      supabase.from('responsavel').select('*').order('nome'),
      supabase.from('entrega_equipamento').select('*').order('id_entrega', { ascending: false })
    ]);

    if (resAtivos.data) setAtivos(resAtivos.data);
    if (resSetores.data) setSetores(resSetores.data);
    if (resResp.data) setResponsaveis(resResp.data);
    if (resEntregas.data) setEntregas(resEntregas.data);
    setLoadingData(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError('Credenciais inválidas. Verifique e-mail e senha.');
    setLoadingAuth(false);
  }

  function abrirModalNovo() {
    setEditingId(null);
    if (activeTab === 'ativos') {
      setFormAtivo({
        nome: '', tipo: 'Notebook', endereco_ip: '', endereco_mac: '',
        status: 'Ativo', id_setor: setores[0]?.id_setor || '', id_responsavel: ''
      });
    } else if (activeTab === 'setores') {
      setFormSetor({ nome: '', localizacao: '' });
    } else if (activeTab === 'responsaveis') {
      setFormResp({ nome: '', email: '', telefone: '' });
    } else {
      setFormEntrega({
        colaborador: '', email_colaborador: '', usuario_rede: '',
        modelo_maquina: '', numero_serie: '', data_entrega: new Date().toISOString().split('T')[0]
      });
    }
    setModalOpen(true);
  }

  function abrirModalEditar(item) {
    if (activeTab === 'ativos') {
      setEditingId(item.id_ativo);
      setFormAtivo({
        nome: item.nome, tipo: item.tipo,
        endereco_ip: item.endereco_ip || '', endereco_mac: item.endereco_mac || '',
        status: item.status, id_setor: item.id_setor, id_responsavel: item.id_responsavel || ''
      });
    } else if (activeTab === 'setores') {
      setEditingId(item.id_setor);
      setFormSetor({ nome: item.nome, localizacao: item.localizacao || '' });
    } else if (activeTab === 'responsaveis') {
      setEditingId(item.id_responsavel);
      setFormResp({ nome: item.nome, email: item.email, telefone: item.telefone || '' });
    } else {
      setEditingId(item.id_entrega);
      setFormEntrega({
        colaborador: item.colaborador,
        email_colaborador: item.email_colaborador || '',
        usuario_rede: item.usuario_rede,
        modelo_maquina: item.modelo_maquina,
        numero_serie: item.numero_serie,
        data_entrega: item.data_entrega
      });
    }
    setModalOpen(true);
  }

  async function salvarRegistro(e) {
    e.preventDefault();
    if (activeTab === 'ativos') {
      const payload = {
        nome: formAtivo.nome.trim(),
        tipo: formAtivo.tipo,
        endereco_ip: formAtivo.endereco_ip.trim() || null,
        endereco_mac: formAtivo.endereco_mac.trim() || null,
        status: formAtivo.status,
        id_setor: Number(formAtivo.id_setor),
        id_responsavel: formAtivo.id_responsavel ? Number(formAtivo.id_responsavel) : null
      };
      const { error } = editingId
        ? await supabase.from('ativo').update(payload).eq('id_ativo', editingId)
        : await supabase.from('ativo').insert([payload]);
      if (error) return showMsg('error', `Erro: ${error.message}`);
      showMsg('success', editingId ? 'Ativo atualizado com sucesso!' : 'Novo ativo adicionado ao inventário!');
    } else if (activeTab === 'setores') {
      const payload = { nome: formSetor.nome.trim(), localizacao: formSetor.localizacao.trim() || null };
      const { error } = editingId
        ? await supabase.from('setor').update(payload).eq('id_setor', editingId)
        : await supabase.from('setor').insert([payload]);
      if (error) return showMsg('error', `Erro: ${error.message}`);
      showMsg('success', editingId ? 'Setor atualizado!' : 'Setor cadastrado!');
    } else if (activeTab === 'responsaveis') {
      const payload = { nome: formResp.nome.trim(), email: formResp.email.trim(), telefone: formResp.telefone.trim() || null };
      const { error } = editingId
        ? await supabase.from('responsavel').update(payload).eq('id_responsavel', editingId)
        : await supabase.from('responsavel').insert([payload]);
      if (error) return showMsg('error', `Erro: ${error.message}`);
      showMsg('success', editingId ? 'Responsável atualizado!' : 'Responsável cadastrado!');
    } else {
      const payload = {
        colaborador: formEntrega.colaborador.trim(),
        email_colaborador: formEntrega.email_colaborador.trim() || null,
        usuario_rede: formEntrega.usuario_rede.trim(),
        modelo_maquina: formEntrega.modelo_maquina.trim(),
        numero_serie: formEntrega.numero_serie.trim(),
        data_entrega: formEntrega.data_entrega
      };
      const { error } = editingId
        ? await supabase.from('entrega_equipamento').update(payload).eq('id_entrega', editingId)
        : await supabase.from('entrega_equipamento').insert([payload]);
      if (error) return showMsg('error', `Erro: ${error.message}`);
      showMsg('success', editingId ? 'Entrega atualizada!' : 'Entrega de equipamento registrada!');
    }
    setModalOpen(false);
    setEditingId(null);
    carregarDados();
  }

  async function excluirRegistro(id) {
    if (!window.confirm(`Tem certeza que deseja excluir o registro #${id}? Esta ação não pode ser desfeita.`)) return;
    if (activeTab === 'ativos') {
      const { error } = await supabase.from('ativo').delete().eq('id_ativo', id);
      if (error) return showMsg('error', error.message);
      showMsg('success', 'Ativo removido do inventário.');
    } else if (activeTab === 'setores') {
      const { error } = await supabase.from('setor').delete().eq('id_setor', id);
      if (error) return showMsg('error', 'Não é possível excluir um setor que possui ativos vinculados.');
      showMsg('success', 'Setor removido.');
    } else if (activeTab === 'responsaveis') {
      const { error } = await supabase.from('responsavel').delete().eq('id_responsavel', id);
      if (error) return showMsg('error', error.message);
      showMsg('success', 'Responsável removido.');
    } else {
      const { error } = await supabase.from('entrega_equipamento').delete().eq('id_entrega', id);
      if (error) return showMsg('error', error.message);
      showMsg('success', 'Registro de entrega removido.');
    }
    carregarDados();
  }

  function formatarDataBR(dataISO) {
    if (!dataISO) return '—';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function gerarTextoTermo(item) {
    return `TERMO DE RESPONSABILIDADE E GUARDA DE EQUIPAMENTO DE TI

Pelo presente termo, o(a) colaborador(a) ${item.colaborador}${item.email_colaborador ? ` (${item.email_colaborador})` : ''}, usuário de rede "${item.usuario_rede}", declara ter recebido da equipe de Infraestrutura de TI o equipamento abaixo especificado, em perfeitas condições de funcionamento:

• Equipamento / Modelo: ${item.modelo_maquina}
• Número de Série (Serial): ${item.numero_serie}
• Data de Entrega: ${formatarDataBR(item.data_entrega)}

O(A) colaborador(a) compromete-se a zelar pela integridade física e lógica do equipamento, utilizá-lo exclusivamente para fins corporativos e devolvê-lo à TI em caso de desligamento ou substituição.

____________________________________________________
Assinatura do(a) Colaborador(a): ${item.colaborador}

____________________________________________________
Responsável TI (${session?.user?.email || 'Infraestrutura'})`;
  }

  function copiarTermo(item) {
    navigator.clipboard.writeText(gerarTextoTermo(item));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function imprimirPDFLimpo(item) {
    const janela = window.open('', '_blank', 'width=850,height=900');
    if (!janela) return;
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Termo de Responsabilidade - ${item.colaborador}</title>
        <style>
          @page { size: A4; margin: 22mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #1B3668;
            padding-bottom: 14px;
            margin-bottom: 28px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #1B3668;
            letter-spacing: -0.5px;
          }
          .brand span { color: #2D7FF9; }
          .doc-meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          h1 {
            text-align: center;
            font-size: 17px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #1B3668;
            margin: 0 0 24px 0;
          }
          p {
            font-size: 13px;
            text-align: justify;
            margin-bottom: 16px;
          }
          .specs-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #2D7FF9;
            border-radius: 6px;
            padding: 16px 20px;
            margin: 22px 0;
          }
          .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .specs-table td {
            padding: 6px 4px;
          }
          .specs-label {
            font-weight: 700;
            color: #1B3668;
            width: 210px;
          }
          .clauses {
            font-size: 12.5px;
            color: #334155;
            margin-top: 18px;
          }
          .clauses li {
            margin-bottom: 8px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            gap: 40px;
            margin-top: 75px;
          }
          .sig-block {
            flex: 1;
            text-align: center;
            border-top: 1px solid #334155;
            padding-top: 8px;
            font-size: 12px;
          }
          .sig-sub {
            color: #64748b;
            font-size: 11px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Infra<span>Track</span></div>
          <div class="doc-meta">
            <strong>Gestão de Ativos & Infraestrutura de TI</strong><br/>
            Registro Nº #${String(item.id_entrega).padStart(4, '0')} • Emitido em ${dataHoje}
          </div>
        </div>

        <h1>Termo de Responsabilidade e Guarda de Equipamento</h1>

        <p>
          Pelo presente instrumento, o(a) colaborador(a) <strong>${item.colaborador}</strong>${item.email_colaborador ? `, e-mail corporativo <strong>${item.email_colaborador}</strong>` : ''},
          identificado(a) pelo usuário de rede <strong>${item.usuario_rede}</strong>, declara ter recebido da equipe de Infraestrutura de TI,
          a título de empréstimo para uso exclusivo em suas atividades profissionais, o equipamento descrito abaixo em perfeitas condições de uso e funcionamento:
        </p>

        <div class="specs-box">
          <table class="specs-table">
            <tr>
              <td class="specs-label">Equipamento / Modelo:</td>
              <td>${item.modelo_maquina}</td>
            </tr>
            <tr>
              <td class="specs-label">Número de Série (Serial):</td>
              <td><code>${item.numero_serie}</code></td>
            </tr>
            <tr>
              <td class="specs-label">Usuário de Rede / AD:</td>
              <td>${item.usuario_rede}</td>
            </tr>
            <tr>
              <td class="specs-label">Data de Entrega:</td>
              <td>${formatarDataBR(item.data_entrega)}</td>
            </tr>
          </table>
        </div>

        <p><strong>Condições de Uso e Guarda:</strong></p>
        <ul class="clauses">
          <li>Zelar pela integridade física e lógica do equipamento, comunicando imediatamente à equipe de TI qualquer defeito, perda, furto ou dano.</li>
          <li>Não instalar softwares não homologados nem alterar configurações de segurança e rede sem autorização prévia da Infraestrutura.</li>
          <li>Devolver o equipamento e seus acessórios nas mesmas condições em caso de desligamento, transferência de setor ou solicitação da empresa.</li>
        </ul>

        <div class="signatures">
          <div class="sig-block">
            <strong>${item.colaborador}</strong><br/>
            <span class="sig-sub">Colaborador(a) • Usuário: ${item.usuario_rede}</span>
          </div>
          <div class="sig-block">
            <strong>Infraestrutura de TI</strong><br/>
            <span class="sig-sub">${session?.user?.email || 'Responsável Técnico'}</span>
          </div>
        </div>

        <div class="footer">
          Documento gerado eletronicamente pelo sistema InfraTrack • Controle de Inventário e Comodato de TI
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    janela.document.close();
  }

  // Filtragem da tabela de ativos
  const ativosFiltrados = ativos.filter(a => {
    const matchText =
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.endereco_ip && a.endereco_ip.includes(searchTerm)) ||
      (a.setor?.nome && a.setor.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.responsavel?.nome && a.responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSetor = filterSetor ? String(a.id_setor) === filterSetor : true;
    const matchStatus = filterStatus ? a.status === filterStatus : true;
    return matchText && matchSetor && matchStatus;
  });

  // Filtragem da tabela de entregas
  const entregasFiltradas = entregas.filter(e =>
    e.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.usuario_rede.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.modelo_maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.numero_serie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // TELA DE LOGIN
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3668] via-[#1E3F7A] to-[#2D7FF9] px-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
          <div className="flex flex-col items-center text-center mb-8">
            <InfraTrackLogo size="lg" />
            <p className="text-sm text-slate-500 mt-2">Plataforma de Inventário e Gestão de Ativos de TI</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3668] mb-1.5">E-mail Corporativo</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@ficr.edu.br"
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D7FF9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3668] mb-1.5">Senha</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D7FF9] focus:border-transparent"
              />
            </div>
            {authError && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{authError}</p>}
            <button
              type="submit" disabled={loadingAuth}
              className="w-full py-3 bg-[#2D7FF9] hover:bg-[#1B3668] text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loadingAuth ? 'Autenticando...' : 'Acessar Painel'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#2D7FF9]" />
            <span>Protegido via Supabase Auth & Row-Level Security</span>
          </div>
        </div>
      </div>
    );
  }

  // CONTADORES DO DASHBOARD
  const totalAtivos = ativos.length;
  const totalOnline = ativos.filter(a => a.status === 'Ativo').length;
  const totalManutencao = ativos.filter(a => a.status === 'Em manutenção').length;

  return (
    <div className="min-h-screen flex bg-[#F4F7FB]">
      {/* SIDEBAR ESCURA */}
      <aside className="w-16 bg-[#13254C] text-blue-200 flex flex-col items-center py-4 justify-between shrink-0 shadow-lg">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
              <path d="M32 10L14 20.5V43.5L32 54" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round" />
              <path d="M32 10L50 20.5V43.5L32 54" stroke="#2D7FF9" strokeWidth="6" strokeLinecap="round" />
              <circle cx="32" cy="10" r="5" fill="#FFF" />
              <circle cx="14" cy="32" r="5" fill="#FFF" />
              <circle cx="50" cy="32" r="5" fill="#FFF" />
              <circle cx="32" cy="54" r="5" fill="#FFF" />
            </svg>
          </div>

          <nav className="flex flex-col gap-3 mt-2">
            {[
              { id: 'ativos', icon: Monitor, title: 'Ativos de TI' },
              { id: 'setores', icon: Building2, title: 'Setores' },
              { id: 'responsaveis', icon: Users, title: 'Responsáveis TI' },
              { id: 'entregas', icon: Laptop, title: 'Entregas & Termos' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSearchTerm(''); }}
                  title={item.title}
                  className={`p-3 rounded-xl transition cursor-pointer ${
                    isActive ? 'bg-[#2D7FF9] text-white shadow-md' : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          title="Sair do sistema"
          className="p-3 rounded-xl text-blue-200/70 hover:bg-red-500/20 hover:text-red-300 transition cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR AZUL COM ABAS ESTILO NAVEGADOR */}
        <header className="bg-gradient-to-r from-[#1B3668] via-[#22488A] to-[#2D7FF9] text-white pt-3 px-6 shadow">
          <div className="flex items-center justify-between mb-3">
            <InfraTrackLogo light />
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/15 px-3 py-1.5 rounded-full text-blue-50 font-medium">
                {session.user.email}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-1.5 overflow-x-auto">
            {[
              { id: 'ativos', label: 'Ativos', icon: Monitor, count: ativos.length },
              { id: 'setores', label: 'Setores', icon: Building2, count: setores.length },
              { id: 'responsaveis', label: 'Responsáveis', icon: Users, count: responsaveis.length },
              { id: 'entregas', label: 'Entregas / Termos', icon: Laptop, count: entregas.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#F4F7FB] text-[#1B3668] shadow-sm'
                      : 'bg-[#13254C]/50 text-blue-100 hover:bg-[#13254C]/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-[#2D7FF9] text-white' : 'bg-white/15 text-blue-100'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="p-6 max-w-[1400px] w-full mx-auto space-y-5">
          {/* KPIs rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total de Ativos</p>
                <p className="text-2xl font-bold text-[#1B3668] mt-0.5">{totalAtivos}</p>
              </div>
              <div className="p-3 bg-blue-50 text-[#2D7FF9] rounded-xl"><Server className="w-5 h-5" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Ativos Operacionais</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalOnline}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Em Manutenção</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{totalManutencao}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Notebooks Entregues</p>
                <p className="text-2xl font-bold text-[#1B3668] mt-0.5">{entregas.length}</p>
              </div>
              <div className="p-3 bg-blue-50 text-[#1B3668] rounded-xl"><Laptop className="w-5 h-5" /></div>
            </div>
          </div>

          {feedback.msg && (
            <div className={`p-3.5 rounded-xl text-sm font-medium border ${
              feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-[#1B3668] border-blue-200'
            }`}>
              {feedback.msg}
            </div>
          )}

          {/* BARRA DE FERRAMENTAS */}
          <div className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={abrirModalNovo}
                className="flex items-center gap-1.5 bg-[#2D7FF9] hover:bg-[#1B3668] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>

              <button
                onClick={carregarDados}
                className="flex items-center gap-1.5 bg-[#EBF3FE] hover:bg-[#DCE9FD] text-[#1B3668] px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} /> Atualizar
              </button>

              {activeTab === 'ativos' && (
                <>
                  <select
                    value={filterSetor}
                    onChange={e => setFilterSetor(e.target.value)}
                    className="bg-[#EBF3FE] text-[#1B3668] px-3.5 py-2 rounded-full text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">Todos os Setores</option>
                    {setores.map(s => <option key={s.id_setor} value={s.id_setor}>{s.nome}</option>)}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-[#EBF3FE] text-[#1B3668] px-3.5 py-2 rounded-full text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">Todos os Status</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Em manutenção">Em manutenção</option>
                    <option value="Desativado">Desativado</option>
                  </select>
                </>
              )}
            </div>

            {(activeTab === 'ativos' || activeTab === 'entregas') && (
              <div className="relative flex-1 min-w-[220px] max-w-xs">
                <Search className="w-4 h-4 text-[#2D7FF9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={activeTab === 'ativos' ? 'Busca rápida por ativo, IP ou setor...' : 'Buscar colaborador, usuário ou serial...'}
                  className="w-full pl-9 pr-4 py-1.5 bg-white text-slate-800 border border-[#2D7FF9]/40 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#2D7FF9]"
                />
              </div>
            )}
          </div>

          {/* TABELAS */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            {activeTab === 'ativos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Nome do Ativo</th>
                      <th className="py-3.5 px-4">Tipo</th>
                      <th className="py-3.5 px-4">Setor / Localização</th>
                      <th className="py-3.5 px-4">Endereço IP</th>
                      <th className="py-3.5 px-4">Endereço MAC</th>
                      <th className="py-3.5 px-4">Responsável TI</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {ativosFiltrados.map(a => (
                      <tr key={a.id_ativo} className="hover:bg-[#F4F8FF] transition">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
                            a.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            a.status === 'Em manutenção' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              a.status === 'Ativo' ? 'bg-emerald-500' :
                              a.status === 'Em manutenção' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1B3668]">{a.nome}</td>
                        <td className="py-3 px-4 text-slate-600">{a.tipo}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{a.setor?.nome}</div>
                          <div className="text-[11px] text-slate-400">{a.setor?.localizacao || ''}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{a.endereco_ip || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{a.endereco_mac || '—'}</td>
                        <td className="py-3 px-4 text-slate-700">{a.responsavel?.nome || <span className="text-slate-400 italic">Não atribuído</span>}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => abrirModalEditar(a)} className="p-1.5 text-[#2D7FF9] hover:bg-blue-50 rounded-lg transition cursor-pointer" title="Editar">
                            <Pencil className="w-4 h-4 inline" />
                          </button>
                          <button onClick={() => excluirRegistro(a.id_ativo)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer" title="Excluir">
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {ativosFiltrados.length === 0 && (
                      <tr><td colSpan="8" className="py-8 text-center text-slate-400">Nenhum ativo encontrado com os filtros atuais.</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  Ativos exibidos: {ativosFiltrados.length} de {ativos.length}
                </div>
              </div>
            )}

            {activeTab === 'setores' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Nome do Setor</th>
                      <th className="py-3.5 px-4">Localização Física</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {setores.map(s => (
                      <tr key={s.id_setor} className="hover:bg-[#F4F8FF]">
                        <td className="py-3 px-4 font-mono text-slate-400">#{s.id_setor}</td>
                        <td className="py-3 px-4 font-bold text-[#1B3668]">{s.nome}</td>
                        <td className="py-3 px-4 text-slate-600">{s.localizacao || '—'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => abrirModalEditar(s)} className="p-1.5 text-[#2D7FF9] hover:bg-blue-50 rounded-lg cursor-pointer"><Pencil className="w-4 h-4 inline" /></button>
                          <button onClick={() => excluirRegistro(s.id_setor)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'responsaveis' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Nome</th>
                      <th className="py-3.5 px-4">E-mail</th>
                      <th className="py-3.5 px-4">Telefone</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {responsaveis.map(r => (
                      <tr key={r.id_responsavel} className="hover:bg-[#F4F8FF]">
                        <td className="py-3 px-4 font-bold text-[#1B3668]">{r.nome}</td>
                        <td className="py-3 px-4 text-slate-600">{r.email}</td>
                        <td className="py-3 px-4 text-slate-600">{r.telefone || '—'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => abrirModalEditar(r)} className="p-1.5 text-[#2D7FF9] hover:bg-blue-50 rounded-lg cursor-pointer"><Pencil className="w-4 h-4 inline" /></button>
                          <button onClick={() => excluirRegistro(r.id_responsavel)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'entregas' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Colaborador</th>
                      <th className="py-3.5 px-4">Usuário de Rede</th>
                      <th className="py-3.5 px-4">Modelo da Máquina</th>
                      <th className="py-3.5 px-4">Nº de Série (Serial)</th>
                      <th className="py-3.5 px-4">Data de Entrega</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {entregasFiltradas.map(item => (
                      <tr key={item.id_entrega} className="hover:bg-[#F4F8FF] transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1B3668]">{item.colaborador}</div>
                          <div className="text-[11px] text-slate-400">{item.email_colaborador || 'Sem e-mail'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{item.usuario_rede}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.modelo_maquina}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{item.numero_serie}</td>
                        <td className="py-3 px-4 text-slate-700">{formatarDataBR(item.data_entrega)}</td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => { setTermoSelecionado(item); setCopiado(false); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#EBF3FE] hover:bg-[#2D7FF9] text-[#1B3668] hover:text-white rounded-lg font-semibold transition cursor-pointer"
                            title="Gerar Termo de Responsabilidade"
                          >
                            <FileText className="w-3.5 h-3.5" /> Gerar Termo
                          </button>
                          <button onClick={() => abrirModalEditar(item)} className="p-1.5 text-[#2D7FF9] hover:bg-blue-50 rounded-lg transition cursor-pointer" title="Editar">
                            <Pencil className="w-4 h-4 inline" />
                          </button>
                          <button onClick={() => excluirRegistro(item.id_entrega)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer" title="Excluir">
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {entregasFiltradas.length === 0 && (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-400">Nenhuma entrega de notebook registrada ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-blue-100 overflow-hidden">
            <div className="bg-[#1B3668] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? 'Editar Registro' : 'Novo Cadastro'} • {
                  activeTab === 'ativos' ? 'Ativo de TI' :
                  activeTab === 'setores' ? 'Setor' :
                  activeTab === 'responsaveis' ? 'Responsável TI' : 'Entrega de Notebook'
                }
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-blue-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={salvarRegistro} className="p-6 space-y-4">
              {activeTab === 'ativos' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Ativo *</label>
                    <input required placeholder="Ex: SW-CORE-01" value={formAtivo.nome}
                      onChange={e => setFormAtivo({ ...formAtivo, nome: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2D7FF9] focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo *</label>
                      <select value={formAtivo.tipo} onChange={e => setFormAtivo({ ...formAtivo, tipo: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm">
                        {['Switch', 'Roteador', 'Servidor', 'Notebook', 'Access Point', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
                      <select value={formAtivo.status} onChange={e => setFormAtivo({ ...formAtivo, status: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm">
                        {['Ativo', 'Em manutenção', 'Desativado'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Endereço IP</label>
                      <input placeholder="192.168.1.10" value={formAtivo.endereco_ip}
                        onChange={e => setFormAtivo({ ...formAtivo, endereco_ip: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Endereço MAC</label>
                      <input placeholder="AA:BB:CC:DD:EE:FF" value={formAtivo.endereco_mac}
                        onChange={e => setFormAtivo({ ...formAtivo, endereco_mac: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Setor *</label>
                    <select required value={formAtivo.id_setor} onChange={e => setFormAtivo({ ...formAtivo, id_setor: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm">
                      <option value="">Selecione um setor</option>
                      {setores.map(s => <option key={s.id_setor} value={s.id_setor}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável TI (Opcional)</label>
                    <select value={formAtivo.id_responsavel} onChange={e => setFormAtivo({ ...formAtivo, id_responsavel: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm">
                      <option value="">Sem responsável definido</option>
                      {responsaveis.map(r => <option key={r.id_responsavel} value={r.id_responsavel}>{r.nome}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'setores' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Setor *</label>
                    <input required placeholder="Ex: Financeiro" value={formSetor.nome}
                      onChange={e => setFormSetor({ ...formSetor, nome: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Localização</label>
                    <input placeholder="Ex: Bloco A - 1º Andar" value={formSetor.localizacao}
                      onChange={e => setFormSetor({ ...formSetor, localizacao: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                </>
              )}

              {activeTab === 'responsaveis' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                    <input required value={formResp.nome}
                      onChange={e => setFormResp({ ...formResp, nome: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail *</label>
                    <input required type="email" value={formResp.email}
                      onChange={e => setFormResp({ ...formResp, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone</label>
                    <input value={formResp.telefone}
                      onChange={e => setFormResp({ ...formResp, telefone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                </>
              )}

              {activeTab === 'entregas' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Colaborador *</label>
                    <input required placeholder="Ex: Mariana Costa" value={formEntrega.colaborador}
                      onChange={e => setFormEntrega({ ...formEntrega, colaborador: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário de Rede / AD *</label>
                      <input required placeholder="Ex: mcosta" value={formEntrega.usuario_rede}
                        onChange={e => setFormEntrega({ ...formEntrega, usuario_rede: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail do Colaborador</label>
                      <input type="email" placeholder="colaborador@empresa.com.br" value={formEntrega.email_colaborador}
                        onChange={e => setFormEntrega({ ...formEntrega, email_colaborador: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Modelo da Máquina *</label>
                    <input required placeholder="Ex: Dell Latitude 3420" value={formEntrega.modelo_maquina}
                      onChange={e => setFormEntrega({ ...formEntrega, modelo_maquina: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nº de Série (Serial) *</label>
                      <input required placeholder="Ex: SN-DL3420-8841" value={formEntrega.numero_serie}
                        onChange={e => setFormEntrega({ ...formEntrega, numero_serie: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Entrega *</label>
                      <input required type="date" value={formEntrega.data_entrega}
                        onChange={e => setFormEntrega({ ...formEntrega, data_entrega: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#2D7FF9] hover:bg-[#1B3668] text-white shadow cursor-pointer">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DO TERMO GERADO */}
      {termoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-blue-100 overflow-hidden">
            <div className="bg-[#1B3668] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">Termo de Responsabilidade • {termoSelecionado.colaborador}</h3>
              </div>
              <button onClick={() => setTermoSelecionado(null)} className="text-blue-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 whitespace-pre-line font-sans leading-relaxed">
                {gerarTextoTermo(termoSelecionado)}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => copiarTermo(termoSelecionado)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#EBF3FE] hover:bg-[#DCE9FD] text-[#1B3668] transition cursor-pointer"
                >
                  {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiado ? 'Texto copiado para o e-mail!' : 'Copiar texto para enviar por e-mail'}
                </button>

                <button
                  onClick={() => imprimirPDFLimpo(termoSelecionado)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2D7FF9] hover:bg-[#1B3668] text-white shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}