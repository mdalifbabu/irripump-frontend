-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'farmer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (following security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create pumps table
CREATE TABLE public.pumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pump_name_bengali TEXT NOT NULL,
  pump_name_english TEXT NOT NULL,
  location TEXT,
  installation_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pumps ENABLE ROW LEVEL SECURITY;

-- Create user_pump_assignments table
CREATE TABLE public.user_pump_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, pump_id)
);

ALTER TABLE public.user_pump_assignments ENABLE ROW LEVEL SECURITY;

-- Create farmers table
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
  farmer_code TEXT UNIQUE NOT NULL,
  code_valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  name_bengali TEXT NOT NULL,
  name_english TEXT,
  father_name TEXT,
  village TEXT,
  mobile TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  nid_number TEXT,
  photo_url TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_farmers_code ON public.farmers(farmer_code);
CREATE INDEX idx_farmers_pump ON public.farmers(pump_id);

-- Create lands table
CREATE TABLE public.lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
  land_identification_number TEXT,
  landmark_number TEXT,
  size_bigha DECIMAL(10,4) NOT NULL,
  size_shatak DECIMAL(10,4),
  coordinates JSONB,
  season TEXT,
  year INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lands_farmer ON public.lands(farmer_id);
CREATE INDEX idx_lands_pump ON public.lands(pump_id);

-- Create unit_prices table
CREATE TABLE public.unit_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
  price_per_bigha DECIMAL(10,2) NOT NULL,
  season TEXT NOT NULL,
  year INTEGER NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.unit_prices ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_unit_prices_pump ON public.unit_prices(pump_id);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank', 'mobile_banking')),
  transaction_reference TEXT,
  remarks TEXT,
  season TEXT,
  year INTEGER,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payments_farmer ON public.payments(farmer_id);
CREATE INDEX idx_payments_pump ON public.payments(pump_id);

-- Create payment_adjustments table
CREATE TABLE public.payment_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  pump_id UUID REFERENCES public.pumps(id) ON DELETE CASCADE NOT NULL,
  adjustment_type TEXT CHECK (adjustment_type IN ('charge', 'discount', 'deduction')),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  season TEXT,
  year INTEGER,
  adjusted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_adjustments ENABLE ROW LEVEL SECURITY;

-- Create farmer_code_history table
CREATE TABLE public.farmer_code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  old_code TEXT NOT NULL,
  new_code TEXT NOT NULL,
  shifted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT
);

ALTER TABLE public.farmer_code_history ENABLE ROW LEVEL SECURITY;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pumps_updated_at BEFORE UPDATE ON public.pumps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lands_updated_at BEFORE UPDATE ON public.lands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_unit_prices_updated_at BEFORE UPDATE ON public.unit_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pumps
CREATE POLICY "Admins can manage pumps" ON public.pumps FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view assigned pumps" ON public.pumps FOR SELECT USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.user_pump_assignments 
    WHERE user_id = auth.uid() AND pump_id = pumps.id AND is_active = true
  )
);

-- RLS Policies for user_pump_assignments
CREATE POLICY "Admins can manage assignments" ON public.user_pump_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own assignments" ON public.user_pump_assignments FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for farmers
CREATE POLICY "Admins can view all farmers" ON public.farmers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage farmers in assigned pumps" ON public.farmers FOR ALL USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.user_pump_assignments 
    WHERE user_id = auth.uid() AND pump_id = farmers.pump_id AND is_active = true
  )
);
CREATE POLICY "Farmers can view own data" ON public.farmers FOR SELECT USING (
  public.has_role(auth.uid(), 'farmer') AND auth.uid() = id
);

-- RLS Policies for lands
CREATE POLICY "Admins can view all lands" ON public.lands FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage lands in assigned pumps" ON public.lands FOR ALL USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.user_pump_assignments 
    WHERE user_id = auth.uid() AND pump_id = lands.pump_id AND is_active = true
  )
);

-- RLS Policies for unit_prices
CREATE POLICY "Admins can view all prices" ON public.unit_prices FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage prices for assigned pumps" ON public.unit_prices FOR ALL USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.user_pump_assignments 
    WHERE user_id = auth.uid() AND pump_id = unit_prices.pump_id AND is_active = true
  )
);

-- RLS Policies for payments
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage payments for assigned pumps" ON public.payments FOR ALL USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.user_pump_assignments 
    WHERE user_id = auth.uid() AND pump_id = payments.pump_id AND is_active = true
  )
);

-- RLS Policies for payment_adjustments
CREATE POLICY "Admins can view all adjustments" ON public.payment_adjustments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage adjustments for assigned pumps" ON public.payment_adjustments FOR ALL USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.user_pump_assignments 
    WHERE user_id = auth.uid() AND pump_id = payment_adjustments.pump_id AND is_active = true
  )
);

-- RLS Policies for farmer_code_history
CREATE POLICY "Admins can view code history" ON public.farmer_code_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view code history for their pump farmers" ON public.farmer_code_history FOR SELECT USING (
  public.has_role(auth.uid(), 'user') AND EXISTS (
    SELECT 1 FROM public.farmers f
    JOIN public.user_pump_assignments upa ON f.pump_id = upa.pump_id
    WHERE f.id = farmer_code_history.farmer_id 
    AND upa.user_id = auth.uid() 
    AND upa.is_active = true
  )
);