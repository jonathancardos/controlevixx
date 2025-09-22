-- Drop the existing foreign key constraint on usuario_id in quinzenas_pagamento
-- O nome da constraint pode variar, 'quinzenas_pagamento_usuario_id_fkey' é um nome comum.
-- Se o erro persistir, verifique o nome exato da constraint no seu dashboard Supabase.
ALTER TABLE public.quinzenas_pagamento
DROP CONSTRAINT IF EXISTS quinzenas_pagamento_usuario_id_fkey;

-- Add the new foreign key constraint referencing public.usuarios.id
ALTER TABLE public.quinzenas_pagamento
ADD CONSTRAINT quinzenas_pagamento_usuario_id_fkey
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;