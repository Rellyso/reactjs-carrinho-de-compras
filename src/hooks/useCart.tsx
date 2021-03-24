import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const addProduct = async (productId: number) => {
    try {

      let response = await api.get(`/stock/${productId}`)
      const stock: Stock = response.data

      if (stock.amount < 0) {
        toast.error('Produto não encontrado')
        return
      }

      const existInCart = cart.find(productInCart => productInCart.id === productId);

      if (!existInCart) {
        response = await api.get(`/products/${productId}`)
        let product: Product = response.data

        // adicionando Amount para o product
        product = {
          ...product,
          amount: 1
        }

        if (stock.amount > 0) {
          // atualizando carrinho
          const newCart: Product[] = [
            ...cart,
            { ...product },
          ];

          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          toast.success('Produto adicionado ao carrinho')
        } else {
          toast.error('Não há mais produtos disponíveis')
        }

      } else if (existInCart) {
        updateProductAmount({
          productId,
          amount: existInCart.amount + 1
        });
      } else {
        return
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const existProduct = cart.find(product => product.id === productId)

      if (!existProduct) {
        throw new Error
      }

      const filteredCart = cart.filter(product => product.id !== productId);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));

      setCart(filteredCart);

      toast.success('Produto removido');

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let response = await api.get(`/stock/${productId}`)
      const stock = response.data

      const productInCart = cart.find(product => product.id === productId);

      const isIncrementingAmount = productInCart && amount > productInCart.amount

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
      }

      if (stock.amount >= amount && amount > 0 && productInCart) {
        // atualizando carrinho com mais um produto
        const updatedCart = cart.map(product => {
          return product.id === productId
            ? { ...product, amount: amount }
            : product;
        });

        // atualizando cart
        setCart(updatedCart);

        // atualizando carrinho no LOCAL STORAGE com mais um produto
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

        let message = 'Produto adicionado ao carrinho.'
        isIncrementingAmount
          ? message = message
          : message = 'Produto removido do carrinho.'
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
