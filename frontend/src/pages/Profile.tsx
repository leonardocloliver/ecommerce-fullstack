import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

type AddressForm = {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;
  zip: string;
};

const emptyAddress: AddressForm = {
  street: '',
  number: '',
  neighborhood: '',
  complement: '',
  city: '',
  state: '',
  zip: '',
};

const parseAddress = (address: string): AddressForm => {
  if (!address) {
    return { ...emptyAddress };
  }

  const zipMatch = address.match(/\b\d{5}-?\d{3}\b/);
  const zip = zipMatch ? zipMatch[0].replace('-', '') : '';
  const cleaned = address.replace(/\b\d{5}-?\d{3}\b/, '').trim();

  const match = cleaned.match(/^([^,]+),\s*([^,]+),\s*([^,]+),\s*(.+?)\s*-\s*([A-Za-z]{2})/);
  if (!match) {
    return {
      ...emptyAddress,
      street: cleaned,
      zip,
    };
  }

  return {
    street: match[1].trim(),
    number: match[2].trim(),
    neighborhood: match[3].trim(),
    complement: '',
    city: match[4].trim(),
    state: match[5].trim().toUpperCase(),
    zip,
  };
};

const formatZip = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const buildAddress = (form: AddressForm) => {
  const mainParts = [form.street, form.number, form.neighborhood, form.complement]
    .map((item) => item.trim())
    .filter(Boolean);
  const cityState = [form.city.trim(), form.state.trim().toUpperCase()]
    .filter(Boolean)
    .join(' - ');
  const segments = [mainParts.join(', '), cityState].filter(Boolean).join(', ');
  const zip = form.zip ? `CEP ${form.zip}` : '';
  return [segments, zip].filter(Boolean).join(', ');
};

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [form, setForm] = useState<AddressForm>(() => parseAddress(user?.address ?? ''));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setForm(parseAddress(user?.address ?? ''));
  }, [user]);

  const addressPreview = useMemo(() => buildAddress(form), [form]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError('Informe seu nome.');
      setSuccess('');
      return;
    }

    if (!form.street.trim() || !form.number.trim() || !form.neighborhood.trim() || !form.city.trim() || !form.state.trim()) {
      setError('Preencha rua, numero, bairro, cidade e UF.');
      setSuccess('');
      return;
    }

    const normalizedAddress = addressPreview.trim();
    if (!normalizedAddress) {
      setError('Informe um endereco de entrega valido.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await updateProfile({ name: normalizedName, address: normalizedAddress });
      setSuccess('Endereco atualizado com sucesso.');
    } catch {
      setError('Nao foi possivel salvar o endereco.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h1>Meu perfil</h1>
          <p>Gerencie seus dados e endereco de entrega.</p>
        </div>
        <Link to="/" className="profile-back">
          Voltar para a loja
        </Link>
      </header>

      <section className="profile-card">
        <div className="profile-section">
          <h2>Dados pessoais</h2>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Nome</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label>Email</label>
              <input type="email" value={user?.email ?? ''} disabled />
            </div>
          </div>
        </div>

        <form className="profile-section" onSubmit={handleSave}>
          <div className="profile-section-header">
            <h2>Endereco de entrega</h2>
            <span>Preencha para agilizar o checkout.</span>
          </div>
          <div className="profile-grid">
            <div className="profile-field profile-span-2">
              <label htmlFor="profile-street">Rua</label>
              <input
                id="profile-street"
                type="text"
                value={form.street}
                onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                placeholder="Avenida Paulista"
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-number">Numero</label>
              <input
                id="profile-number"
                type="text"
                value={form.number}
                onChange={(event) => setForm((prev) => ({ ...prev, number: event.target.value }))}
                placeholder="1000"
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-complement">Complemento</label>
              <input
                id="profile-complement"
                type="text"
                value={form.complement}
                onChange={(event) => setForm((prev) => ({ ...prev, complement: event.target.value }))}
                placeholder="Apto 42"
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-neighborhood">Bairro</label>
              <input
                id="profile-neighborhood"
                type="text"
                value={form.neighborhood}
                onChange={(event) => setForm((prev) => ({ ...prev, neighborhood: event.target.value }))}
                placeholder="Bela Vista"
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-city">Cidade</label>
              <input
                id="profile-city"
                type="text"
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="Sao Paulo"
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-state">UF</label>
              <input
                id="profile-state"
                type="text"
                value={form.state}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    state: event.target.value.toUpperCase().slice(0, 2),
                  }))
                }
                placeholder="SP"
                maxLength={2}
                disabled={isSaving}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-zip">CEP</label>
              <input
                id="profile-zip"
                type="text"
                value={form.zip}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    zip: formatZip(event.target.value),
                  }))
                }
                placeholder="00000-000"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="profile-preview">
            <span>Endereco que sera salvo</span>
            <strong>{addressPreview || 'Preencha os campos para visualizar.'}</strong>
          </div>

          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}
          <button className="profile-save" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar endereco'}
          </button>
        </form>
      </section>
    </div>
  );
}
