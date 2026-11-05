import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'register' | 'forgot';

export function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('E-mail ou senha incorretos.');
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError('Erro ao criar conta. Tente outro e-mail.');
    else setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) setError('Erro ao enviar e-mail. Verifique o endereço.');
    else setSuccess('E-mail enviado! Verifique sua caixa de entrada.');
    setLoading(false);
  };

  const titles: Record<Mode, { title: string; sub: string }> = {
    login: { title: 'Bem-vindo de volta', sub: 'Entre com sua conta para continuar' },
    register: { title: 'Criar conta', sub: 'Preencha os dados para se cadastrar' },
    forgot: { title: 'Recuperar senha', sub: 'Enviaremos um link para seu e-mail' },
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f4f5f7', fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .ag-wrap{display:flex;width:860px;min-height:520px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);}
        .ag-left{width:42%;background:#0f1923;padding:40px 36px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;}
        .ag-left::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:rgba(55,138,221,0.12);}
        .ag-left::after{content:'';position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;border-radius:50%;background:rgba(55,138,221,0.07);}
        .ag-logo{display:flex;align-items:center;gap:10px;position:relative;z-index:1;}
        .ag-logo-icon{width:36px;height:36px;background:#378ADD;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;}
        .ag-logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#fff;letter-spacing:-0.5px;}
        .ag-tagline{position:relative;z-index:1;}
        .ag-tagline h2{font-family:'Syne',sans-serif;font-weight:700;font-size:24px;color:#fff;line-height:1.3;margin:0 0 10px;}
        .ag-tagline p{font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;margin:0;}
        .ag-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:1;}
        .ag-card{background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;}
        .ag-card-label{font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;}
        .ag-card-val{font-family:'Syne',sans-serif;font-size:14px;font-weight:600;color:rgba(255,255,255,0.85);}
        .ag-right{flex:1;background:#fff;padding:44px 40px;display:flex;flex-direction:column;justify-content:center;}
        .ag-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#0f1923;margin:0 0 4px;}
        .ag-sub{font-size:13px;color:#888;margin:0 0 24px;}
        .ag-label{display:block;font-size:11px;font-weight:500;color:#999;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;}
        .ag-input{width:100%;height:42px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;color:#0f1923;font-family:'DM Sans',sans-serif;font-size:14px;padding:0 14px;box-sizing:border-box;outline:none;transition:border-color 0.15s,box-shadow 0.15s;}
        .ag-input:focus{border-color:#378ADD;box-shadow:0 0 0 3px rgba(55,138,221,0.12);background:#fff;}
        .ag-field{margin-bottom:14px;}
        .ag-btn{width:100%;height:44px;background:#0f1923;color:#fff;border:none;border-radius:8px;font-family:'Syne',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.15s;margin-top:6px;}
        .ag-btn:hover{background:#1a2b3a;}
        .ag-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .ag-btn-secondary{width:100%;height:44px;background:#fff;color:#0f1923;border:1px solid #e5e7eb;border-radius:8px;font-family:'Syne',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.15s;margin-top:8px;}
        .ag-btn-secondary:hover{background:#f9fafb;}
        .ag-forgot{display:block;text-align:right;font-size:12px;color:#378ADD;cursor:pointer;margin-top:-4px;margin-bottom:16px;background:none;border:none;padding:0;font-family:'DM Sans',sans-serif;}
        .ag-forgot:hover{text-decoration:underline;}
        .ag-error{background:#fff1f0;border:1px solid #fca5a5;color:#b91c1c;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:14px;}
        .ag-success{background:#f0fdf4;border:1px solid #86efac;color:#166534;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:14px;}
        .ag-divider{display:flex;align-items:center;gap:10px;margin:16px 0;}
        .ag-divider-line{flex:1;height:1px;background:#f0f0f0;}
        .ag-divider-text{font-size:11px;color:#bbb;text-transform:uppercase;letter-spacing:0.4px;}
        .ag-back{font-size:12px;color:#378ADD;cursor:pointer;background:none;border:none;padding:0;font-family:'DM Sans',sans-serif;margin-top:10px;display:block;}
        .ag-back:hover{text-decoration:underline;}
        @media(max-width:640px){.ag-wrap{flex-direction:column;width:100%;min-height:100vh;border-radius:0;}.ag-left{width:100%;padding:28px 24px;min-height:180px;}.ag-right{padding:32px 24px;}}
      `}</style>

      <div className="ag-wrap">
        <div className="ag-left">
          <div className="ag-logo">
            <div className="ag-logo-icon">🚗</div>
            <span className="ag-logo-text">AutoGestão</span>
          </div>
          <div className="ag-tagline">
            <h2>Controle total da sua revenda</h2>
            <p>Gerencie estoque, vendas, leads e despesas em um só lugar.</p>
          </div>
          <div className="ag-cards">
            <div className="ag-card"><div className="ag-card-label">Estoque</div><div className="ag-card-val">Veículos</div></div>
            <div className="ag-card"><div className="ag-card-label">Financeiro</div><div className="ag-card-val">Completo</div></div>
            <div className="ag-card"><div className="ag-card-label">CRM</div><div className="ag-card-val">Leads</div></div>
            <div className="ag-card"><div className="ag-card-label">Relatórios</div><div className="ag-card-val">Tempo real</div></div>
          </div>
        </div>

        <div className="ag-right">
          <p className="ag-title">{titles[mode].title}</p>
          <p className="ag-sub">{titles[mode].sub}</p>

          {error && <div className="ag-error">{error}</div>}
          {success && <div className="ag-success">{success}</div>}

          {/* LOGIN */}
          {mode === 'login' && !success && (
            <form onSubmit={handleLogin}>
              <div className="ag-field"><label className="ag-label">E-mail</label><input className="ag-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="ag-field"><label className="ag-label">Senha</label><input className="ag-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
              <button type="button" className="ag-forgot" onClick={() => reset('forgot')}>Esqueci minha senha</button>
              <button className="ag-btn" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
              <div className="ag-divider"><div className="ag-divider-line" /><span className="ag-divider-text">ou</span><div className="ag-divider-line" /></div>
              <button type="button" className="ag-btn-secondary" onClick={() => reset('register')}>Criar conta</button>
            </form>
          )}

          {/* CADASTRO */}
          {mode === 'register' && !success && (
            <form onSubmit={handleRegister}>
              <div className="ag-field"><label className="ag-label">E-mail</label><input className="ag-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="ag-field"><label className="ag-label">Senha</label><input className="ag-input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required /></div>
              <div className="ag-field"><label className="ag-label">Confirmar senha</label><input className="ag-input" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
              <button className="ag-btn" type="submit" disabled={loading}>{loading ? 'Criando conta...' : 'Criar conta'}</button>
              <button type="button" className="ag-back" onClick={() => reset('login')}>← Voltar para o login</button>
            </form>
          )}

          {/* ESQUECI SENHA */}
          {mode === 'forgot' && !success && (
            <form onSubmit={handleForgot}>
              <div className="ag-field"><label className="ag-label">E-mail</label><input className="ag-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <button className="ag-btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar link'}</button>
              <button type="button" className="ag-back" onClick={() => reset('login')}>← Voltar para o login</button>
            </form>
          )}

          {success && mode === 'register' && (
            <button type="button" className="ag-back" onClick={() => reset('login')}>← Voltar para o login</button>
          )}
        </div>
      </div>
    </div>
  );
}