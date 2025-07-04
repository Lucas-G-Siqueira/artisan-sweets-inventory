
-- Create the estoque_doces (sweets inventory) table
CREATE TABLE public.estoque_doces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sabor TEXT NOT NULL,
  categoria TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  data_fabricacao DATE,
  data_validade DATE NOT NULL,
  status TEXT DEFAULT 'Disponível',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.estoque_doces ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since this is an inventory management system)
-- You can modify these later if you want to add user authentication
CREATE POLICY "Allow all operations on estoque_doces" 
  ON public.estoque_doces 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create an index on data_validade for better performance when checking expiration dates
CREATE INDEX idx_estoque_doces_data_validade ON public.estoque_doces(data_validade);

-- Create an index on nome for better search performance
CREATE INDEX idx_estoque_doces_nome ON public.estoque_doces(nome);
