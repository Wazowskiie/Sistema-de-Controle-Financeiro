// Datas salvas como "2026-10-01" (sem hora) são lidas pelo navegador como
// meia-noite UTC — em Fortaleza isso ainda é o dia anterior. Fixar meio-dia evita o erro.
export function lerData(valor: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor + 'T12:00:00' : valor);
}

export function formatarData(valor?: string | null): string {
  if (!valor) return '—';
  const d = lerData(valor);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}
